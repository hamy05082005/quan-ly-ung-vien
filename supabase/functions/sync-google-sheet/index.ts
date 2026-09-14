import { createClient } from 'npm:@supabase/supabase-js@2.116.0'
import { GoogleAuth } from 'npm:google-auth-library@9.15.1'

const corsBase = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
}
const makeCors = (origin: string) => ({ ...corsBase, 'Access-Control-Allow-Origin': origin })

const fail = (message: string, status = 400, origin = '*') =>
  new Response(JSON.stringify({ error: message }), { status, headers: makeCors(origin) })

const normalizeHeader = (value: string) => value
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('vi-VN').replace(/[^a-z0-9]/g, '')

const normalizeKeyPart = (value: unknown) => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN')

const text = (value: unknown) => String(value ?? '').trim()

function isoDate(value: unknown) {
  const raw = text(value)
  if (!raw) return null
  const match = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  return Number.isNaN(Date.parse(`${result}T00:00:00Z`)) ? null : result
}

function warranty(value: unknown) {
  const v = normalizeKeyPart(value)
  if (v === 'pass') return 'pass'
  if (v === 'fail') return 'fail'
  return null
}

/** Fuzzy-match a tab name against spreadsheet metadata, handling diacritic encoding issues. */
function findTab(
  sheets: { properties: { sheetId: number; title: string } }[],
  tabName: string,
): { properties: { sheetId: number; title: string } } | null {
  const asciiOnly = (s: string): string =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/gi, '').toLowerCase()
  const tabKey = asciiOnly(tabName)
  let matchedSheet = sheets.find(s => asciiOnly(s.properties.title) === tabKey)
  if (!matchedSheet && tabKey.length >= 5) {
    let bestScore = 4
    for (const s of sheets) {
      const t = asciiOnly(s.properties.title)
      let score = 0
      while (score < t.length && score < tabKey.length && t[score] === tabKey[score]) score++
      if (score > bestScore) { bestScore = score; matchedSheet = s }
    }
  }
  return matchedSheet ?? null
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin') ?? '*'
  const corsHeaders = makeCors(origin)

  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Chỉ chấp nhận yêu cầu POST.' }), { status: 405, headers: corsHeaders })
  }

  // Parse body ONCE — the stream can only be consumed once
  let requestBody: Record<string, unknown> = {}
  try { requestBody = await request.json() } catch { /* empty body is OK */ }
  const action = String(requestBody?.action ?? 'sync')

  // ── Load secrets ────────────────────────────────────────────────────────────
  const url = Deno.env.get('SUPABASE_URL')
  const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}')
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
  const publishableKey = publishableKeys.default ?? Deno.env.get('SUPABASE_ANON_KEY')
  const secretKey = secretKeys.default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const rawCredentials = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
  const sheetId = Deno.env.get('GOOGLE_SHEET_ID')
  const tab = Deno.env.get('GOOGLE_SHEET_TAB')

  if (!url || !publishableKey || !secretKey || !rawCredentials || !sheetId || !tab) {
    return fail('Hàm chưa được cấu hình đủ secrets.', 500, origin)
  }

  // ── Authenticate user from JWT ───────────────────────────────────────────────
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) {
    return new Response(JSON.stringify({ error: 'Vui lòng đăng nhập lại trước khi thực hiện thao tác này.' }), { status: 401, headers: corsHeaders })
  }
  const userClient = createClient(url, publishableKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: authData, error: authError } = await userClient.auth.getUser(token)
  if (authError || !authData.user) {
    return new Response(JSON.stringify({ error: 'Phiên đăng nhập không hợp lệ.' }), { status: 401, headers: corsHeaders })
  }

  let credentials: Record<string, unknown>
  try { credentials = JSON.parse(rawCredentials) } catch { return fail('Secret Google JSON không hợp lệ.', 500, origin) }

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const ownerId = authData.user.id

  // ══════════════════════════════════════════════════════════════════════════════
  // ACTION: verify
  // Check if a given CTV code exists in the Google Sheet — does NOT write any data.
  // Called from Settings before saving the collaborator_code to user profile.
  // ══════════════════════════════════════════════════════════════════════════════
  if (action === 'verify') {
    const codeToVerify = String(requestBody?.code ?? '').trim().toUpperCase()
    if (!codeToVerify) return fail('Vui lòng nhập mã CTV cần xác minh.', 400, origin)

    try {
      const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] })
      const client = await auth.getClient()

      // Get sheet metadata
      const metaRes = await client.request<{ data?: { sheets?: { properties: { sheetId: number; title: string } }[] } }>({
        url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties`,
        method: 'GET',
      })
      const sheets = metaRes.data.sheets ?? []
      const matchedSheet = findTab(sheets, tab)
      if (!matchedSheet) {
        const available = sheets.map(s => `'${s.properties.title}'`).join(', ')
        return fail(`Không tìm thấy tab '${tab}'. Các tab có sẵn: ${available}`, 400, origin)
      }

      // Read sheet data (only need code column)
      const exactTitle = matchedSheet.properties.title
      const safeRange = encodeURIComponent(`'${exactTitle.replace(/'/g, "''")}'!A:Z`)
      const dataRes = await client.request<{ data?: { values?: unknown[][] } }>({
        url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${safeRange}`,
        method: 'GET',
      })
      const values = dataRes.data.values ?? []
      if (values.length < 2) {
        return new Response(JSON.stringify({ valid: false, count: 0, code: codeToVerify }), { headers: corsHeaders })
      }

      // Find CTV code column
      const headers = (values[0] as unknown[]).map(v => normalizeHeader(text(v)))
      const codeCol = [normalizeHeader('MÃ CODE CTV'), normalizeHeader('MÃ CTV')]
        .map(h => headers.indexOf(h))
        .find(i => i >= 0) ?? -1
      if (codeCol < 0) return fail('Không tìm thấy cột MÃ CODE CTV trong Sheet.', 400, origin)

      // Count rows with this exact code
      const count = values.slice(1).filter(row => text(row[codeCol]).trim().toUpperCase() === codeToVerify).length
      return new Response(
        JSON.stringify({ valid: count > 0, count, code: codeToVerify }),
        { headers: corsHeaders },
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể đọc Google Sheet.'
      return fail(message, 500, origin)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ACTION: sync
  // Full sync — only allowed if user's profile has a collaborator_code.
  // The code stored in the profile is used to filter rows, not an env var.
  // ══════════════════════════════════════════════════════════════════════════════

  // Gate: user must have a collaborator_code saved in their profile
  const { data: profile, error: profileError } = await admin
    .from('recruitment_profiles')
    .select('collaborator_code')
    .eq('id', ownerId)
    .maybeSingle()

  if (profileError) return fail('Không đọc được thông tin tài khoản.', 500, origin)
  if (!profile?.collaborator_code) {
    return new Response(
      JSON.stringify({ error: 'Tài khoản của bạn chưa có mã CTV. Vui lòng nhập và xác minh mã trong phần Cài đặt trước khi đồng bộ.' }),
      { status: 403, headers: corsHeaders },
    )
  }
  const collaboratorCode = profile.collaborator_code.trim().toUpperCase()

  // Create sync run log
  const { data: run, error: runError } = await admin
    .from('recruitment_sync_runs')
    .insert({ owner_id: ownerId, status: 'running' })
    .select('id').single()
  if (runError) {
    return new Response(JSON.stringify({ error: `Không tạo được nhật ký đồng bộ: ${runError.message}` }), { status: 500, headers: corsHeaders })
  }

  try {
    const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] })
    const client = await auth.getClient()

    // Step 1: Get spreadsheet metadata to find the correct sheet by normalized name.
    // This avoids encoding issues when the tab name contains Vietnamese characters stored in secrets.
    const metaResponse = await client.request<{ data?: { sheets?: { properties: { sheetId: number; title: string } }[] } }>({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties`,
      method: 'GET',
    })
    const sheets = metaResponse.data.sheets ?? []
    const matchedSheet = findTab(sheets, tab)

    if (!matchedSheet) {
      const available = sheets.map(s => `'${s.properties.title}'`).join(', ')
      throw new Error(`Không tìm thấy tab khớp với '${tab}' trong Sheet. Các tab hiện có: ${available}`)
    }

    // Step 2: Read values using the exact title from metadata to avoid encoding drift.
    const exactTitle = matchedSheet.properties.title
    const safeRange = encodeURIComponent(`'${exactTitle.replace(/'/g, "''")}'!A:Z`)
    const response = await client.request<{ data?: { values?: unknown[][] } }>({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${safeRange}`,
      method: 'GET',
    })
    const values = response.data.values ?? []
    if (values.length < 2) throw new Error(`Tab '${exactTitle}' không có dòng dữ liệu để đồng bộ.`)

    const headers = (values[0] as unknown[]).map(v => normalizeHeader(text(v)))
    const column = (...names: string[]) => {
      const indexes = names.map(normalizeHeader).map(name => headers.indexOf(name)).filter(i => i >= 0)
      return indexes[0] ?? -1
    }
    const codeCol = column('MÃ CODE CTV', 'MÃ CTV')
    const nameCol = column('HỌ VÀ TÊN ỨNG VIÊN', 'HỌ TÊN ỨNG VIÊN')
    const jobCol = column('VỊ TRÍ ỨNG TUYỂN - TÊN DỰ ÁN', 'VỊ TRÍ ỨNG TUYỂN')
    if ([codeCol, nameCol, jobCol].some(i => i < 0)) throw new Error('Không tìm thấy các cột MÃ CODE CTV, HỌ VÀ TÊN ỨNG VIÊN hoặc VỊ TRÍ ỨNG TUYỂN - TÊN DỰ ÁN.')
    const interviewCol = column('KẾT QUẢ')
    const startCol = column('TÌNH TRẠNG NHẬN VIỆC')
    const warrantyEndCol = column('NGÀY KẾT THÚC BẢO HÀNH')
    const warrantyCol = column('TÌNH TRẠNG BẢO HÀNH')

    // Step 3: Read job-list tabs (e.g. LIST JOBS MASS, LIST JOBS HUNT) for COST per job.
    const jobCostMap = new Map<string, number>()
    const jobListTabs = sheets.filter(s => {
      const n = s.properties.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/gi, '').toLowerCase()
      return n.startsWith('listjob') || n.includes('listjob')
    })
    for (const jobTab of jobListTabs) {
      try {
        const jt = jobTab.properties.title
        const jr = encodeURIComponent(`'${jt.replace(/'/g, "''")}'!A:Z`)
        const jRes = await client.request<{ data?: { values?: unknown[][] } }>({
          url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${jr}`,
          method: 'GET',
        })
        const jv = jRes.data.values ?? []
        if (jv.length < 2) continue
        const jh = (jv[0] as unknown[]).map(v => normalizeHeader(text(v)))
        const costIdx = jh.indexOf('cost')
        if (costIdx < 0) continue
        const nameIdx = jh.findIndex(h =>
          ['tenduan', 'vitri', 'tenviectlam', 'vitriungtuyen', 'job', 'tendu', 'tenvitri'].some(k => h === k || h.startsWith(k))
        )
        if (nameIdx < 0) continue
        for (const row of jv.slice(1)) {
          const jn = text(row[nameIdx])
          const rawCost = text(row[costIdx]).replace(/[^\d]/g, '')
          const c = rawCost ? Number(rawCost) : 0
          if (jn && c > 0) jobCostMap.set(normalizeKeyPart(jn), c)
        }
      } catch { /* skip unreadable job tab */ }
    }

    // Step 4: Deduplicate rows by collaborator code + candidate name + job title
    const unique = new Map<string, unknown[]>()
    let skipped = 0
    for (const row of values.slice(1)) {
      if (text(row[codeCol]).toUpperCase() !== collaboratorCode) continue
      const name = text(row[nameCol]), jobTitle = text(row[jobCol])
      if (!name || !jobTitle) { skipped++; continue }
      const key = `${collaboratorCode}|${normalizeKeyPart(name)}|${normalizeKeyPart(jobTitle)}`
      if (unique.has(key)) { skipped++; continue }
      unique.set(key, row)
    }

    let imported = 0
    const { data: allJobs } = await admin.from('recruitment_jobs').select('id, title').eq('owner_id', ownerId)
    const jobMap = new Map<string, string>()
    if (allJobs) {
      for (const j of allJobs) {
        if (j.title) jobMap.set(normalizeKeyPart(j.title), j.id)
      }
    }

    for (const [externalKey, row] of unique) {
      const name = text(row[nameCol]), jobTitle = text(row[jobCol])
      const normJobTitle = normalizeKeyPart(jobTitle)
      let jobId = jobMap.get(normJobTitle)
      const commission = jobCostMap.get(normJobTitle) ?? null

      if (!jobId) {
        const { data: createdJob, error: createJobError } = await admin
          .from('recruitment_jobs')
          .insert({ owner_id: ownerId, title: jobTitle, ...(commission !== null ? { commission_amount: commission } : {}) })
          .select('id').single()
        if (createJobError) throw createJobError
        jobId = createdJob.id
        jobMap.set(normJobTitle, jobId)
      } else if (commission !== null) {
        // Update commission if read from sheet (non-blocking)
        await admin.from('recruitment_jobs').update({ commission_amount: commission }).eq('id', jobId).eq('owner_id', ownerId)
      }
      const interview = text(interviewCol >= 0 ? row[interviewCol] : '')
      const started = text(startCol >= 0 ? row[startCol] : '')
      const isShow = normalizeKeyPart(started) === 'show'
      const isNoShow = normalizeKeyPart(interview) === 'noshow'
      const status = isShow ? 'hired' : normalizeKeyPart(interview) === 'pass' ? 'offer' : 'interview'
      const payload = {
        owner_id: ownerId, job_id: jobId, name, external_candidate_key: externalKey,
        current_status: status, needs_follow_up: isNoShow,
        source_customer_interview_result: interview || null,
        source_start_work_status: started || null,
        warranty_end_date: warrantyEndCol >= 0 ? isoDate(row[warrantyEndCol]) : null,
        warranty_status: warranty(warrantyCol >= 0 ? row[warrantyCol] : null),
        source_last_synced_at: new Date().toISOString(),
      }
      const { error: candidateError } = await admin.from('recruitment_candidates').upsert(payload, { onConflict: 'owner_id,external_candidate_key' })
      if (candidateError) throw candidateError
      imported++
    }
    await admin.from('recruitment_sync_runs').update({ status: skipped ? 'partial' : 'success', finished_at: new Date().toISOString() }).eq('id', run.id)
    return new Response(JSON.stringify({ imported, skipped, sourceRows: unique.size, collaboratorCode }), { headers: corsHeaders })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định.'
    await admin.from('recruitment_sync_runs').update({ status: 'failed', finished_at: new Date().toISOString(), error_message: message.slice(0, 1000) }).eq('id', run.id)
    return fail(message, 500, origin)
  }
})
