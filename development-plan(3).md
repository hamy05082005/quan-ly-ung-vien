# Development Plan — Recruitment Pipeline

**Nguồn:** `project-overview-prd.md`, `design-guidelines.md`  
**Trạng thái:** Ready for repository discovery  
**Ngày:** 2026-09-11  

## 1. Mục tiêu triển khai

- **MVP cần giao:** Web app responsive cho nhiều CTV tuyển dụng/freelancer, mỗi người có tài khoản và workspace riêng để quản lý Job/JD, ứng viên, xem pipeline cá nhân, nhận biết ứng viên vừa cập nhật và ứng viên cần follow-up.
- **Core user flow:** Đăng ký/đăng nhập → vào “Pipeline của tôi” → xem candidate theo stage → nhận biết “Vừa cập nhật” / “Cần follow-up” → mở chi tiết candidate/Job → thực hiện bước tiếp theo.
- **Điều kiện hoàn tất cấp sản phẩm:** Core flow chạy đầu-cuối; dữ liệu của mỗi CTV được cô lập; pipeline phản ánh trạng thái hiện tại; sync với Google Sheet có contract rõ và xử lý được stale/error/unmapped; UI có đủ loading/empty/error/success.

## 2. Ràng buộc và nguyên tắc

- Không mở rộng scope ngoài PRD.
- Desktop/laptop là trải nghiệm chính; mobile phải hoàn thành được core flow.
- Không tạo dashboard trung gian: sau login, người dùng đi thẳng tới “Pipeline của tôi”.
- Google Sheet là nguồn đồng bộ trạng thái, không phải database chính của app.
- MVP chỉ giữ **trạng thái hiện tại** của candidate, chưa lưu full status history.
- MVP dùng **một bộ pipeline status cố định**.
- Mỗi candidate trong MVP chỉ gắn với **một Job tại một thời điểm**.
- `needs_follow_up` do hệ thống tính theo rule; **rule cụ thể CHƯA ĐỦ DỮ LIỆU và phải được xác minh trước khi hard-code**.
- Google Sheet đã có **mã CTV**; đây là khóa chính để map dữ liệu Sheet về đúng user.
- Không dùng tên CTV làm khóa mapping.
- Không giả định schema Supabase đã tồn tại hoặc đã được migrate. Codex phải khảo sát repo/project trước.
- Mọi migration, breaking change hoặc thao tác phá hủy phải được báo trước và xác nhận.

## 3. Repository discovery gate

Trước khi sửa code, Codex phải:

- [ ] Đọc ba tài liệu dự án.
- [ ] Kiểm tra stack, package manager và lệnh chạy thực tế.
- [ ] Xác định repo là greenfield hay đã có code.
- [ ] Xác định module/file hiện có liên quan đến auth, data access, UI, Supabase và Google integration.
- [ ] Xác định test, lint, build và deploy command.
- [ ] Kiểm tra biến môi trường và cách quản lý secret hiện tại.
- [ ] Nếu đã có Supabase project/config, xác định project thực tế và schema hiện có.
- [ ] Báo mọi mâu thuẫn giữa repo và tài liệu trước khi đổi public contract hoặc schema.
- [ ] Không tự đặt tên stage Google Sheet, candidate identifier hoặc follow-up rule nếu chưa có dữ liệu thật.

## 4. Technical approach

- **Stack hiện có:** `<Codex xác nhận sau khi khảo sát repo>`
- **Stack đề xuất nếu greenfield:** Next.js + TypeScript + Tailwind CSS + Supabase Auth/Postgres + Supabase client + server-side integration layer cho Google Sheets.
- **Kiến trúc tổng thể:**
  - Web UI: auth, pipeline, candidates, jobs.
  - Application/data layer: truy vấn Supabase theo user hiện tại.
  - Supabase: Auth + Postgres + RLS.
  - Google Sheet sync service: đọc dữ liệu nguồn, lọc theo `collaborator_code`, map candidate/status, cập nhật database.
  - Follow-up rule layer: tính `needs_follow_up` từ rule được xác minh.
- **Lý do:** Stack đủ phổ biến, phù hợp web app responsive, auth + database + RLS gọn, dễ bàn giao cho người mới.
- **Trade-off:** Google Sheet sync là phần rủi ro nhất; phải có data contract rõ trước khi coi sync là ổn định.
- **Nhãn:** `Đề xuất — cần xác nhận sau khi Codex khảo sát repo`.

## 5. Data model

> Trạng thái hiện tại: **schema đã được chốt ở mức thiết kế nhưng chưa được provision/xác minh trên Supabase trong phiên chuẩn bị này**. Codex phải tạo hoặc đối chiếu schema thực tế trước khi UI integration.

### `profiles`

| Field | Kiểu gợi ý | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | PK, FK tới auth user | Một profile cho một tài khoản |
| `collaborator_code` | text | unique, not null | Map với mã CTV trong Google Sheet |
| `display_name` | text | nullable/not null tùy signup | Tên hiển thị |
| `created_at` | timestamptz | default now | Audit cơ bản |

### `jobs`

| Field | Kiểu gợi ý | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | PK | |
| `owner_id` | uuid | FK → profiles.id, not null | CTV sở hữu |
| `title` | text | not null | Tên vị trí |
| `company_name` | text | nullable | Company context |
| `jd_url` | text | nullable | Link Google Doc/JD nếu có |
| `created_at` | timestamptz | default now | |
| `updated_at` | timestamptz | default now | |

### `candidates`

| Field | Kiểu gợi ý | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | PK | |
| `owner_id` | uuid | FK → profiles.id, not null | CTV sở hữu |
| `job_id` | uuid | FK → jobs.id | MVP: một candidate gắn một Job |
| `name` | text | not null | |
| `email` | text | nullable | Chỉ dùng nếu dữ liệu nguồn hỗ trợ |
| `phone` | text | nullable | Chỉ dùng nếu dữ liệu nguồn hỗ trợ |
| `external_candidate_key` | text | nullable | Khóa mapping nếu Sheet có identifier ổn định |
| `current_status` | text | not null | Giá trị phải theo bộ status chuẩn |
| `status_updated_at` | timestamptz | nullable | Lần gần nhất status đổi |
| `needs_follow_up` | boolean | default false | Tính theo rule đã xác minh |
| `created_at` | timestamptz | default now | |
| `updated_at` | timestamptz | default now | |

### `sync_runs`

| Field | Kiểu gợi ý | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | PK | |
| `owner_id` | uuid | FK → profiles.id | Có thể null nếu sync batch toàn hệ thống |
| `started_at` | timestamptz | not null | |
| `finished_at` | timestamptz | nullable | |
| `status` | text | not null | `running/success/failed/partial` |
| `error_message` | text | nullable | Không ghi secret/PII |
| `created_at` | timestamptz | default now | |

### Quan hệ và RLS

- `profiles.id` ↔ auth user id.
- `profiles.collaborator_code` phải unique.
- `jobs.owner_id` → `profiles.id`.
- `candidates.owner_id` → `profiles.id`.
- `candidates.job_id` → `jobs.id`.
- `sync_runs.owner_id` → `profiles.id` nếu sync theo user.
- Bật RLS cho mọi bảng có dữ liệu người dùng.
- User chỉ đọc/ghi dữ liệu có `owner_id = auth.uid()` hoặc profile tương ứng.
- Tạo index tối thiểu cho `owner_id`, `job_id`, `current_status`, `collaborator_code`.
- Không thêm bảng status history trong MVP.

## 6. API và interface contracts

Tên endpoint/file cụ thể để `<Codex xác nhận sau khi khảo sát repo>`.

| Interface/endpoint | Input | Output | Lỗi/validation |
|---|---|---|---|
| Auth signup/login | credential hợp lệ | session/user | auth error, invalid input |
| Get my pipeline | current user | candidates group theo status | unauthorized, query error |
| Create/update Job | title + optional company/JD URL | job | required field, ownership |
| Create/update candidate | candidate + job + identifier | candidate | required field, invalid job ownership |
| Get candidate detail | candidate id | candidate + job context | not found, unauthorized |
| Google Sheet sync | collaborator code + source config | sync result + candidate updates | access denied, malformed row, unmapped status, duplicate candidate |
| Sync status | current user | latest sync state/timestamp | no sync yet, failed |
| Follow-up evaluation | candidate/status/timestamp + verified rule | `needs_follow_up` | rule missing/invalid |

### Data contract bắt buộc cho Google Sheet trước khi code sync thật

Codex phải xác định và ghi rõ:

- Tên cột chứa `collaborator_code`.
- Tên cột nhận diện candidate.
- Tên cột status.
- Tên/ID Job nếu có.
- Danh sách status thực tế và mapping vào pipeline.
- Cách xử lý duplicate row.
- Cách xử lý candidate không map được.
- Quyền/API dùng để đọc Sheet.
- Tần suất sync.
- Rule xác định “Vừa cập nhật”.
- Rule xác định `needs_follow_up`.

Nếu một trong các điểm trên chưa rõ, sync phải dùng fixture/mock data và đánh dấu integration thật là blocked.

## 7. Component/module architecture

| Module/component | Trách nhiệm | Phụ thuộc | File dự kiến |
|---|---|---|---|
| `AppShell` | layout/navigation responsive | auth state | `<Codex xác nhận sau khi khảo sát repo>` |
| `PipelineBoard` | render pipeline | candidate query | `<Codex xác nhận sau khi khảo sát repo>` |
| `PipelineColumn` | nhóm candidate theo status | pipeline config | `<Codex xác nhận sau khi khảo sát repo>` |
| `CandidateCard` | scan candidate + update/follow-up signal | candidate data | `<Codex xác nhận sau khi khảo sát repo>` |
| `StatusBadge` | status label | status mapping | `<Codex xác nhận sau khi khảo sát repo>` |
| `UpdatedBadge` | “Vừa cập nhật” | sync comparison | `<Codex xác nhận sau khi khảo sát repo>` |
| `FollowUpBadge` | “Cần follow-up” | follow-up evaluator | `<Codex xác nhận sau khi khảo sát repo>` |
| `SyncStatus` | freshness/sync error | sync_runs | `<Codex xác nhận sau khi khảo sát repo>` |
| `CandidateForm` | create/update candidate | candidate mutation | `<Codex xác nhận sau khi khảo sát repo>` |
| `JobForm` | create/update Job | job mutation | `<Codex xác nhận sau khi khảo sát repo>` |
| `SearchFilterBar` | tìm/filter candidate | candidate list | `<Codex xác nhận sau khi khảo sát repo>` |
| Auth/data client | session + DB access | Supabase | `<Codex xác nhận sau khi khảo sát repo>` |
| Sheet sync service | fetch/map/update status | Google Sheet + Supabase | `<Codex xác nhận sau khi khảo sát repo>` |
| Follow-up evaluator | tính `needs_follow_up` | verified business rule | `<Codex xác nhận sau khi khảo sát repo>` |

## 8. Bản đồ phase

- [ ] Phase 0 — Repository discovery và baseline
- [ ] Phase 1 — Project foundation và UI shell
- [ ] Phase 2 — Supabase schema, Auth và RLS
- [ ] Phase 3 — Job/Candidate CRUD và data access
- [ ] Phase 4 — Pipeline UI và trạng thái UX
- [ ] Phase 5 — Google Sheet sync và follow-up rule
- [ ] Phase 6 — UI ↔ database integration và hardening
- [ ] Phase 7 — QA, deploy thử nghiệm và feedback

## 9. Chi tiết từng phase

### Phase 0 — Repository discovery và baseline

- **Mục tiêu:** Hiểu repo thật trước khi đổi code.
- **Input:** Ba tài liệu dự án.
- **Dependency:** Không.
- **File/module dự kiến:** `<Codex xác nhận sau khi khảo sát repo>`.
- **Công việc:**
  1. Kiểm tra framework, package manager, scripts, env, test/lint/build.
  2. Xác định code hiện có cho auth, database, UI và integration.
  3. Chạy baseline build/test/lint nếu có.
  4. Báo mâu thuẫn giữa repo và tài liệu.
- **Artifact đầu ra:** Repository discovery note trong task/PR description hoặc tài liệu nội bộ.
- **Done criteria:**
  - [ ] Stack và commands thực tế đã được xác nhận.
  - [ ] Baseline pass/fail đã biết.
  - [ ] Không còn giả định đường dẫn file.
- **Cách kiểm chứng:** Chạy các command thật của repo.
- **Rủi ro:** Repo đã có kiến trúc khác đề xuất.
- **Handoff:** Chỉ sang phase 1 sau khi biết stack thật.

### Phase 1 — Project foundation và UI shell

- **Mục tiêu:** Có app shell responsive đúng design guideline.
- **Input:** Design guideline.
- **Dependency:** Phase 0.
- **File/module dự kiến:** `<Codex xác nhận sau khi khảo sát repo>`.
- **Công việc:**
  1. Thiết lập design tokens, typography, spacing.
  2. Tạo AppShell desktop/mobile.
  3. Tạo route/surface cho Pipeline, Candidates, Jobs, auth.
  4. Tạo shared EmptyState, ErrorBanner, loading skeleton.
- **Artifact đầu ra:** UI shell điều hướng được với mock data.
- **Done criteria:**
  - [ ] Desktop/mobile render đúng hierarchy.
  - [ ] “Pipeline của tôi” là home sau login giả lập.
  - [ ] Không có feature ngoài PRD.
- **Cách kiểm chứng:** Manual responsive check + build.
- **Rủi ro:** UI lib hiện có khác đề xuất.
- **Handoff:** Component shell sẵn để đấu data.

### Phase 2 — Supabase schema, Auth và RLS

- **Mục tiêu:** Provision và xác minh database thật.
- **Input:** Data model trong plan này.
- **Dependency:** Phase 0.
- **File/module dự kiến:** migration/config `<Codex xác nhận sau khi khảo sát repo>`.
- **Công việc:**
  1. Xác định Supabase project/config thực tế.
  2. Đọc schema hiện có trước khi migration.
  3. Tạo hoặc điều chỉnh migration cho `profiles`, `jobs`, `candidates`, `sync_runs`.
  4. Tạo foreign keys/indexes.
  5. Bật RLS và policy ownership.
  6. Thiết lập Auth flow.
  7. Đọc lại schema/policy sau migration để xác minh.
- **Artifact đầu ra:** Migration + Auth/RLS hoạt động.
- **Done criteria:**
  - [ ] 4 bảng tồn tại đúng contract hoặc có mapping tương đương được ghi rõ.
  - [ ] `collaborator_code` unique.
  - [ ] User A không đọc/ghi được dữ liệu User B.
  - [ ] Migration không phá dữ liệu hiện có ngoài phạm vi được duyệt.
- **Cách kiểm chứng:** Schema inspection + integration tests với ít nhất hai user test.
- **Rủi ro:** Repo/project đã có schema khác.
- **Handoff:** Chỉ sang CRUD khi schema thực tế đã xác minh.

### Phase 3 — Job/Candidate CRUD và data access

- **Mục tiêu:** Quản lý dữ liệu nghiệp vụ cơ bản.
- **Input:** Supabase schema thật.
- **Dependency:** Phase 2.
- **File/module dự kiến:** `<Codex xác nhận sau khi khảo sát repo>`.
- **Công việc:**
  1. Implement Job list/create/edit.
  2. Implement Candidate list/create/edit/detail.
  3. Enforce candidate chỉ gắn Job cùng owner.
  4. Search/filter cơ bản.
  5. Validation + loading/error/success.
- **Artifact đầu ra:** CRUD dùng database thật.
- **Done criteria:**
  - [ ] CTV chỉ thấy Job/Candidate của mình.
  - [ ] Candidate gắn được một Job.
  - [ ] Form lỗi không làm mất input khi có thể.
- **Cách kiểm chứng:** Integration tests + manual two-user test.
- **Rủi ro:** Candidate identifier nguồn chưa rõ.
- **Handoff:** Dữ liệu đủ để render pipeline.

### Phase 4 — Pipeline UI và trạng thái UX

- **Mục tiêu:** Hoàn thiện core surface “Pipeline của tôi”.
- **Input:** Candidate data + design guideline.
- **Dependency:** Phase 3.
- **File/module dự kiến:** `<Codex xác nhận sau khi khảo sát repo>`.
- **Công việc:**
  1. Render candidate theo bộ status cố định.
  2. Tạo CandidateCard hierarchy đúng guideline.
  3. Hiển thị `Vừa cập nhật`, `Cần follow-up`, sync freshness.
  4. Xử lý loading/empty/error/success.
  5. Mobile không thu nhỏ nguyên board desktop; dùng layout phù hợp màn hình nhỏ.
- **Artifact đầu ra:** Pipeline chạy bằng DB/mock sync state.
- **Done criteria:**
  - [ ] Scan được status/update/follow-up.
  - [ ] Không dùng màu làm tín hiệu duy nhất.
  - [ ] Core flow chạy được trên desktop và mobile.
- **Cách kiểm chứng:** UI acceptance checklist + manual flow.
- **Rủi ro:** Quá nhiều stage làm board khó scan.
- **Handoff:** Sẵn để nhận dữ liệu sync thật.

### Phase 5 — Google Sheet sync và follow-up rule

- **Mục tiêu:** Thay Ctrl+F thủ công bằng sync có kiểm soát.
- **Input:** Google Sheet thực tế + collaborator code + candidate identifier + status mapping.
- **Dependency:** Phase 2–4.
- **File/module dự kiến:** `<Codex xác nhận sau khi khảo sát repo>`.
- **Công việc:**
  1. Xác minh quyền đọc Google Sheet và data contract.
  2. Lọc row theo `profiles.collaborator_code`.
  3. Map candidate theo identifier đã xác minh.
  4. Map source status → pipeline status chuẩn.
  5. Khi status đổi, update `current_status`, `status_updated_at`.
  6. Ghi `sync_runs`.
  7. Xử lý partial/unmapped/duplicate rõ ràng.
  8. Implement follow-up evaluator sau khi rule thật được chốt.
- **Artifact đầu ra:** Sync service + logs/status an toàn.
- **Done criteria:**
  - [ ] Không lấy row của CTV khác.
  - [ ] Candidate map đúng theo key đã xác minh.
  - [ ] Status change phản ánh đúng vào pipeline.
  - [ ] Sync lỗi không xóa dữ liệu hiện tại.
  - [ ] UI biết dữ liệu stale/failed.
- **Cách kiểm chứng:** Fixture tests + integration test với sheet test hoặc sample export.
- **Rủi ro:** Sheet đổi cột, duplicate candidate, status không chuẩn hóa.
- **Handoff:** Dữ liệu thật sẵn để end-to-end.

### Phase 6 — UI ↔ database integration và hardening

- **Mục tiêu:** Đấu toàn bộ UI surface vào schema thật và khóa behavior.
- **Input:** UI components + Supabase schema thực tế + sync service.
- **Dependency:** Phase 3–5.
- **File/module dự kiến:** `<Codex xác nhận sau khi khảo sát repo>`.
- **Mapping bắt buộc:**
  - `CandidateForm.name` → `candidates.name`
  - Candidate Job selector → `candidates.job_id`
  - Candidate current stage → `candidates.current_status`
  - “Vừa cập nhật” → so với `status_updated_at`/sync rule đã chốt
  - “Cần follow-up” → `candidates.needs_follow_up`
  - Pipeline columns → grouped `candidates.current_status`
  - Job list/form → `jobs`
  - Sync freshness/error → `sync_runs`
  - User identity → auth user + `profiles`
  - Sheet ownership mapping → `profiles.collaborator_code`
- **Công việc:**
  1. Thay mock data bằng DB query/mutation.
  2. Đảm bảo auth/session bảo vệ route và data.
  3. Đảm bảo RLS vẫn là lớp bảo vệ cuối cùng.
  4. Xử lý optimistic/loading/error phù hợp.
  5. Test full user flow.
- **Artifact đầu ra:** MVP end-to-end bằng database thật.
- **Done criteria:**
  - [ ] Không còn mock data trong core flow.
  - [ ] UI states map đúng DB/sync states.
  - [ ] Không lộ dữ liệu cross-user.
- **Cách kiểm chứng:** Integration + E2E.
- **Rủi ro:** Contract UI/data lệch nhau.
- **Handoff:** Sẵn QA/deploy.

### Phase 7 — QA, deploy thử nghiệm và feedback

- **Mục tiêu:** Có bản thử nghiệm cho CTV mục tiêu.
- **Input:** MVP end-to-end.
- **Dependency:** Phase 6.
- **File/module dự kiến:** `<Codex xác nhận sau khi khảo sát repo>`.
- **Công việc:**
  1. Chạy test/lint/build.
  2. Security/privacy smoke test.
  3. Deploy môi trường thử nghiệm.
  4. Smoke test sau deploy.
  5. Cho một nhóm nhỏ CTV mục tiêu dùng thử.
  6. Thu feedback về thời gian tìm trạng thái, độ rõ pipeline và follow-up.
- **Artifact đầu ra:** Staging MVP + feedback notes.
- **Done criteria:**
  - [ ] Core flow chạy trên staging.
  - [ ] Không có P0 blocker.
  - [ ] Có feedback thật từ CTV ngoài chủ sản phẩm.
- **Cách kiểm chứng:** E2E/manual test + feedback session.
- **Rủi ro:** Data source thật khác fixture.
- **Handoff:** Quyết định iterate/pivot dựa trên feedback.

## 10. Test và validation strategy

| Requirement/criterion | Loại test | Cách kiểm chứng | Evidence mong đợi |
|---|---|---|---|
| FR-01 Auth/workspace | integration/e2e | Hai user login riêng | Không cross-user data |
| FR-02 Job CRUD | integration | Create/edit/read Job | DB row đúng owner |
| FR-03 Candidate CRUD | integration | Create/edit candidate | Candidate gắn Job đúng owner |
| FR-04 Pipeline | e2e/manual | Mở Pipeline của tôi | Candidate group đúng status |
| FR-05 Sheet sync | integration | Thay status ở fixture/source test | DB status cập nhật đúng |
| FR-06 Vừa cập nhật | integration/manual | Sync thay đổi status | Badge xuất hiện đúng rule |
| FR-07 Follow-up | unit/integration | Chạy evaluator với case mẫu | `needs_follow_up` đúng rule |
| FR-08 Isolation | security/integration | User A query record B | Bị từ chối |
| Sync failure | integration/manual | Giả lập lỗi nguồn | Dữ liệu cũ còn, UI báo stale/error |
| Responsive | manual/e2e | Desktop + mobile viewport | Core flow hoàn thành được |

## 11. Security, privacy và reliability

- **Input validation:** Validate form và dữ liệu sync trước khi ghi DB.
- **Auth/authorization:** Supabase Auth + RLS; UI guard không thay thế RLS.
- **Secret và biến môi trường:** Google credentials, Supabase service role và secret chỉ ở server-side env; không commit.
- **Dữ liệu cá nhân:** Candidate email/phone chỉ lưu nếu thật sự cần cho mapping/workflow.
- **Error handling và recovery:** Sync lỗi không overwrite dữ liệu bằng null/unknown; giữ last known state.
- **Logging:** Không log access token, service key, email/phone đầy đủ hoặc dữ liệu nhạy cảm không cần thiết.
- **RLS test:** Bắt buộc test tối thiểu hai user.
- **Migration safety:** Không drop/rename destructive nếu chưa được duyệt.

## 12. Deploy và feedback loop

- **Môi trường thử nghiệm:** Staging/preview environment tách khỏi production nếu repo hỗ trợ.
- **Cấu hình cần có:** Supabase URL/key phù hợp môi trường, Google Sheet access config, source Sheet ID/config, auth redirect URL.
- **Smoke test sau deploy:** Signup/login → tạo Job → tạo candidate → pipeline → sync test → update/follow-up signal → logout/login lại.
- **Ai dùng thử:** Một nhóm nhỏ CTV tuyển dụng/freelancer tương tự user mục tiêu.
- **Feedback cần thu:** Có còn phải mở Sheet không; pipeline có giúp nhìn nhanh hơn không; update/follow-up có đúng và đáng tin không; phần nào gây nhầm.
- **Điều kiện quyết định tiếp tục/pivot/dừng:** Không đặt KPI giả. Dựa trên quan sát test và feedback thật; nếu mapping/sync không đáng tin, ưu tiên sửa data contract trước khi thêm feature.

## 13. Open decisions cho Codex hoặc chủ sản phẩm

- [ ] Xác nhận stack/repo thật.
- [ ] Xác nhận Supabase project/schema hiện có trước migration.
- [ ] Xác nhận tên cột Google Sheet chứa mã CTV.
- [ ] Xác nhận candidate identifier ổn định.
- [ ] Xác nhận danh sách status thực tế và mapping.
- [ ] Xác nhận rule “Vừa cập nhật”.
- [ ] Xác nhận rule `needs_follow_up`.
- [ ] Xác nhận phương thức và quyền đọc Google Sheet.
- [ ] Xác nhận tần suất sync.
- [ ] Xác nhận Job/JD nhập tay hay chỉ lưu link trong MVP.
- [ ] Nếu repo đã có schema khác, đề xuất mapping/migration và xin duyệt trước breaking change.

## 14. Definition of Done toàn MVP

- [ ] Core user flow chạy đầu-cuối.
- [ ] P0 requirements đạt success criteria tương ứng.
- [ ] Auth và data isolation đã được test với ít nhất hai user.
- [ ] Supabase schema thực tế đã được đọc lại và xác minh sau migration.
- [ ] Google Sheet sync map đúng theo mã CTV và candidate identifier đã chốt.
- [ ] Trạng thái loading, empty, error, success, stale và partial sync đã được xử lý.
- [ ] `needs_follow_up` không dùng rule phỏng đoán.
- [ ] Test, lint và build của repository chạy xanh.
- [ ] Không lộ secret hoặc dữ liệu cá nhân trong code/log.
- [ ] Bản thử nghiệm có thể được người dùng mục tiêu trải nghiệm.
