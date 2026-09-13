import { createClient } from 'npm:@supabase/supabase-js@2.116.0'
import { GoogleAuth } from 'npm:google-auth-library@9.15.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'null',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
}

const fail = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders })

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
  const match = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return fail('Chỉ chấp nhận yêu cầu POST.', 405)

  const url = Deno.env.get('SUPABASE_URL')
  const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}')
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
  const publishableKey = publishableKeys.default ?? Deno.env.get('SUPABASE_ANON_KEY')
  const secretKey = secretKeys.default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  // This is the verified Supabase user id of the CTV837 workspace owner.
  // It avoids depending on a manually typed email address in a secret.
  const allowedUserId = '464a058b-04a0-4721-9faf-04119e1897d4'
  const collaboratorCode = (Deno.env.get('GOOGLE_COLLABORATOR_CODE') ?? 'CTV837').trim().toUpperCase()
  const rawCredentials = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
  const sheetId = Deno.env.get('GOOGLE_SHEET_ID')
  const tab = Deno.env.get('GOOGLE_SHEET_TAB')

  if (!url || !publishableKey || !secretKey || !rawCredentials || !sheetId || !tab) {
    return fail('Hàm chưa được cấu hình đủ secrets.', 500)
  }

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return fail('Vui lòng đăng nhập lại trước khi đồng bộ.', 401)
  const userClient = createClient(url, publishableKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: authData, error: authError } = await userClient.auth.getUser(token)
  if (authError || !authData.user) return fail('Phiên đăng nhập không hợp lệ.', 401)
  if (authData.user.id !== allowedUserId) return fail('Tài khoản này không được phép đồng bộ Sheet.', 403)

  let credentials: Record<string, unknown>
  try { credentials = JSON.parse(rawCredentials) } catch { return fail('Secret Google JSON không hợp lệ.', 500) }

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const ownerId = authData.user.id
  const { data: run, error: runError } = await admin
    .from('recruitment_sync_runs')
    .insert({ owner_id: ownerId, status: 'running' })
    .select('id').single()
  if (runError) return fail(`Không tạo được nhật ký đồng bộ: ${runError.message}`, 500)

  try {
    const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] })
    const client = await auth.getClient()
    const range = `'${tab.replace(/'/g, "''")}'!A:Z`
    const response = await client.request<{ data?: { values?: unknown[][] } }>({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}`,
      method: 'GET',
    })
    const values = response.data.values ?? []
    if (values.length < 2) throw new Error('Sheet không có dòng dữ liệu để đồng bộ.')

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
    for (const [externalKey, row] of unique) {
      const name = text(row[nameCol]), jobTitle = text(row[jobCol])
      const { data: existingJob, error: findJobError } = await admin
        .from('recruitment_jobs').select('id').eq('owner_id', ownerId).eq('title', jobTitle).maybeSingle()
      if (findJobError) throw findJobError
      let jobId = existingJob?.id
      if (!jobId) {
        const { data: createdJob, error: createJobError } = await admin
          .from('recruitment_jobs').insert({ owner_id: ownerId, title: jobTitle }).select('id').single()
        if (createJobError) throw createJobError
        jobId = createdJob.id
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
    return fail(message, 500)
  }
})
