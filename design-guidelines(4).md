# Design Guidelines — Recruitment Pipeline

**Nguồn:** `project-overview-prd.md`  
**Trạng thái:** Draft  
**Ngày:** 2026-09-11  

## 1. Design direction

- **Hướng được khuyến nghị:** SaaS tối giản, lấy pipeline làm trung tâm, ưu tiên khả năng scan nhanh và nhận biết việc cần xử lý.
- **Ba tính từ định hướng:** Rõ ràng — Tập trung — Đáng tin.
- **Vì sao phù hợp:** Người dùng đang mất thời gian dò trạng thái trong dữ liệu phân tán. UI cần giảm nhiễu và làm nổi bật ứng viên đang ở đâu, ai vừa cập nhật và ai cần follow-up.
- **Điều cần tránh:** Dashboard enterprise dày đặc chart/widget; decoration không phục vụ tác vụ; quá nhiều CTA cạnh tranh; dùng màu làm tín hiệu duy nhất.
- **Giả định thiết kế:** Desktop/laptop là trải nghiệm chính; mobile dùng để kiểm tra nhanh và thực hiện các hành động cơ bản. MVP chưa cần đầu tư logo riêng.

### Nguồn quyết định

- **Thông tin user cung cấp:** Desktop/laptop là thiết bị chính; mobile cần responsive; hành động đầu tiên là xem “Pipeline của tôi”; cảm giác mong muốn là rõ ràng, tập trung, đáng tin; chấp thuận art direction và mặc định accessibility/ngôn ngữ.
- **Đề xuất của coach:** Blue-led minimal SaaS UI; Inter hoặc sans-serif tương đương; wordmark thay logo riêng; pipeline là bề mặt chính sau đăng nhập.
- **Giả định cần kiểm chứng:** Candidate card và board nhiều cột có còn dễ dùng khi số ứng viên/job tăng; cách biểu diễn “cần follow-up” phù hợp workflow thực tế; tên và số lượng trạng thái pipeline sẽ phụ thuộc dữ liệu Google Sheet thực tế.

## 2. UX principles

1. **Mở ra là thấy việc cần biết:** Sau đăng nhập, ưu tiên Pipeline của tôi thay vì dashboard trung gian.
2. **Scan trước, đọc sau:** Trạng thái, cập nhật mới và follow-up phải nhận biết được nhanh trước khi mở chi tiết.
3. **Một tín hiệu phải có nhiều hơn màu sắc:** Badge, icon, text và hierarchy hỗ trợ nhau.
4. **Giữ context tuyển dụng:** Candidate luôn gắn với Job/vị trí đủ để người dùng hiểu họ đang theo dõi ai cho việc gì.
5. **Không giả vờ dữ liệu đang mới:** Khi sync lỗi hoặc chưa hoàn tất, UI phải nói rõ tình trạng.

## 3. Information architecture

- **Khu vực chính:** Pipeline của tôi; Ứng viên; Jobs/JD; khu vực tài khoản/cấu hình.
- **Quan hệ điều hướng:** Pipeline là home sau đăng nhập. Từ candidate card có thể mở chi tiết ứng viên và Job liên quan. Danh sách Ứng viên và Jobs/JD là các view hỗ trợ.
- **Nội dung ưu tiên:** (1) cần follow-up, (2) vừa cập nhật, (3) trạng thái hiện tại, (4) candidate + Job context, (5) tình trạng đồng bộ.

## 4. Core user flow

1. **Entry:** Người dùng đăng nhập và vào thẳng “Pipeline của tôi”.
2. **Primary action:** Scan các candidate card theo từng giai đoạn.
3. **System feedback:** Badge/text cho biết candidate vừa cập nhật, cần follow-up và thời điểm dữ liệu được đồng bộ.
4. **Result:** Người dùng biết ứng viên đang ở đâu và trường hợp nào cần chú ý.
5. **Next useful action:** Mở candidate để xem context và thực hiện follow-up/công việc tiếp theo.

## 5. Screens and states

| Màn hình | Mục đích | Nội dung chính | Trạng thái bắt buộc |
|---|---|---|---|
| Đăng ký / Đăng nhập | Truy cập workspace cá nhân | Form auth, validation, link chuyển mode | default, loading, validation error, auth error, success |
| Pipeline của tôi | Bề mặt làm việc chính | Pipeline columns, candidate cards, updated/follow-up signals, sync status | default, loading, empty, sync error, partial/unmapped warning, success |
| Chi tiết ứng viên | Hiểu candidate và context tuyển dụng | Thông tin chính, Job liên quan, status, update/follow-up context | default, loading, error, missing data |
| Danh sách ứng viên | Tìm và quản lý ứng viên cá nhân | Search/filter cơ bản, candidate rows/cards, status, Job | default, loading, empty, error |
| Jobs/JD | Quản lý context vị trí | Job list, title, company/context tối thiểu, JD/link nếu có | default, loading, empty, error |
| Tạo/Sửa Job | Nhập dữ liệu Job tối thiểu | Form Job/JD | default, validation error, saving, success, error |
| Tạo/Sửa ứng viên | Nhập dữ liệu ứng viên tối thiểu | Form candidate, Job liên quan, định danh cần thiết | default, validation error, saving, success, error |

## 6. Component inventory

| Component | Trách nhiệm | Biến thể/state | Ghi chú accessibility |
|---|---|---|---|
| AppShell | Navigation + vùng nội dung | desktop sidebar, mobile header/nav | Landmark semantic, keyboard reachable |
| PipelineBoard | Hiển thị pipeline | loading, empty, populated, error | Không phụ thuộc drag-and-drop để hoàn thành core task |
| PipelineColumn | Nhóm candidate theo status | normal, empty | Heading rõ và có số lượng bằng text |
| CandidateCard | Tóm tắt candidate | normal, updated, follow-up, updated+follow-up | Badge/icon + text, không chỉ đổi màu |
| StatusBadge | Hiển thị trạng thái | theo pipeline status | Text label luôn có |
| UpdatedBadge | Báo cập nhật mới | visible/hidden | Có text “Vừa cập nhật” |
| FollowUpBadge | Báo cần xử lý | visible/hidden | Có text “Cần follow-up” |
| SyncStatus | Cho biết freshness dữ liệu | syncing, synced, failed, stale | Dùng icon + text + timestamp khi có |
| CandidateForm | Tạo/sửa candidate | idle, invalid, saving, error, success | Label thật, error liên kết field |
| JobForm | Tạo/sửa Job | idle, invalid, saving, error, success | Tương tự CandidateForm |
| EmptyState | Hướng dẫn khi chưa có dữ liệu | candidate/job/pipeline | CTA duy nhất phù hợp context |
| ErrorBanner | Lỗi có thể phục hồi | sync/form/page | Có mô tả và hành động thử lại |
| SearchFilterBar | Tìm candidate nhanh | default, active filters | Keyboard accessible, clear filters |

## 7. Layout và responsive behavior

- **Mobile:** Pipeline hiển thị từng status theo section/tab hoặc horizontal flow dễ kiểm soát; candidate card full-width; ưu tiên follow-up/updated trước metadata phụ.
- **Tablet:** Giữ navigation gọn, cho phép 2–3 vùng thông tin tùy chiều rộng.
- **Desktop:** Sidebar gọn + content rộng; pipeline board là vùng chính và có thể scroll ngang khi số status vượt chiều rộng.
- **Grid/container:** App shell full-width có max padding 24–32px; form/detail dùng container hẹp hơn để dễ đọc.
- **Ưu tiên khi không đủ chỗ:** Candidate name → follow-up/update → status → Job → metadata phụ.

## 8. Design tokens

### Color

| Token | Giá trị đề xuất | Mục đích |
|---|---|---|
| `color-primary` | `#2563EB` | CTA, active navigation, focus accent |
| `color-primary-dark` | `#1D4ED8` | pressed/strong emphasis |
| `color-background` | `#F8FAFC` | nền ứng dụng |
| `color-surface` | `#FFFFFF` | card/panel |
| `color-text` | `#0F172A` | text chính |
| `color-text-muted` | `#475569` | metadata |
| `color-border` | `#E2E8F0` | border/divider |
| `color-follow-up` | `#D97706` | tín hiệu follow-up kèm label |
| `color-success` | `#15803D` | trạng thái thành công/positive |
| `color-danger` | `#DC2626` | lỗi/cảnh báo nghiêm trọng |

### Typography

- **Font family:** Inter; fallback `ui-sans-serif, system-ui, sans-serif`.
- **Display/heading/body/label:** Display 28–32/700; H1 24/700; H2 18–20/600; body 14–16/400; label 13–14/600.
- **Nguyên tắc độ dài dòng:** Nội dung dài khoảng 60–75 ký tự/dòng; candidate card ưu tiên text ngắn và truncation có cách xem đầy đủ.

### Spacing, radius và elevation

- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48px.
- **Radius:** 8px cho control; 10–12px cho card/panel.
- **Border/elevation:** Border nhẹ là mặc định; shadow rất nhẹ chỉ khi cần tách lớp. Tránh card nổi quá mạnh.

## 9. Interaction và feedback

- **Primary action:** Mỗi vùng quyết định chỉ có một CTA chính.
- **Hover/focus/pressed/disabled:** Hover nhẹ trên desktop; focus ring rõ; pressed có phản hồi; disabled vẫn đọc được và có lý do khi cần.
- **Validation:** Hiển thị cạnh field sau tương tác/submit; nói rõ cách sửa.
- **Loading:** Skeleton cho board/list; spinner chỉ cho action nhỏ.
- **Success:** Feedback ngắn, không chặn luồng.
- **Error và recovery:** Lỗi sync không xóa trạng thái hiện có; hiển thị freshness và nút thử lại. Lỗi form giữ input khi có thể.

## 10. Content và microcopy

- **Ngôn ngữ:** Tiếng Việt.
- **Tone:** Ngắn, bình tĩnh, trực tiếp, không dùng jargon HR không cần thiết.
- **Quy tắc label/button/error:** Button dùng động từ rõ: “Thêm ứng viên”, “Lưu Job”, “Thử đồng bộ lại”. Error nói việc gì xảy ra + người dùng có thể làm gì.
- **Ví dụ copy chính:**
  - Heading: “Pipeline của tôi”
  - Badge: “Vừa cập nhật”
  - Badge: “Cần follow-up”
  - Sync: “Đã đồng bộ 10 phút trước”
  - Sync error: “Chưa thể cập nhật dữ liệu mới. Pipeline hiện đang hiển thị dữ liệu lần đồng bộ gần nhất.”
  - Empty: “Chưa có ứng viên trong pipeline.”
  - CTA: “Thêm ứng viên”

## 11. Accessibility

- **Tương phản:** Text và control phải đạt tương phản đọc tốt; không dùng text xám quá nhạt.
- **Keyboard và focus:** Mọi control có thể truy cập bằng bàn phím; focus ring dễ nhận biết.
- **Label và semantic structure:** Form có label thật; heading theo hierarchy; trạng thái quan trọng có text.
- **Touch target:** Mục tiêu tối thiểu khoảng 44×44px trên mobile cho hành động chính.
- **Motion/reduced motion:** Animation ngắn, không cần thiết cho core flow; tôn trọng reduced-motion preference.

## 12. UI acceptance checklist

- [ ] Hành động chính nổi bật và chỉ có một primary CTA trong mỗi vùng quyết định.
- [ ] Sau đăng nhập, người dùng đến được “Pipeline của tôi” mà không qua dashboard trung gian.
- [ ] Người dùng phân biệt được candidate bình thường, vừa cập nhật và cần follow-up mà không dựa riêng vào màu.
- [ ] Mobile và desktop đều hoàn thành được core user flow.
- [ ] Loading, empty, error và success có cách hiển thị cụ thể.
- [ ] Sync failure/freshness được thể hiện rõ, không làm người dùng hiểu nhầm dữ liệu cũ là mới.
- [ ] Form có label, validation và hướng phục hồi lỗi.
- [ ] UI không đưa thêm tính năng ngoài PRD.

## 13. UI Spec Prompt — copy toàn bộ vào công cụ thiết kế

Bạn là một senior product designer. Hãy tạo UI mockup hoàn chỉnh cho sản phẩm dưới đây.

### Bối cảnh sản phẩm

Tên tạm thời: Recruitment Pipeline.

Đây là web app responsive dành cho cộng tác viên tuyển dụng/freelancer làm việc với các công ty headhunt và cùng lúc phụ trách nhiều vị trí. Hiện tại họ phải tìm JD từ nhiều Google Docs, lưu ứng viên riêng và Ctrl+F từng người trên Google Sheet chung để kiểm tra trạng thái. Pain chính là mất thời gian kiểm tra thủ công, khó nhìn toàn bộ pipeline và dễ bỏ sót ứng viên cần follow-up.

Câu định vị:
“Tôi tạo ra Recruitment Pipeline dành cho CTV tuyển dụng/freelancer làm việc với công ty headhunt để giúp họ theo dõi toàn bộ ứng viên của mình trên một pipeline tự cập nhật.”

### Mục tiêu trải nghiệm

Sau khi đăng nhập, đưa người dùng thẳng tới “Pipeline của tôi”. Trong vài giây họ phải nhận biết:
1. Ứng viên đang ở giai đoạn nào.
2. Ứng viên nào vừa được cập nhật.
3. Ứng viên nào cần follow-up.

Hành động tiếp theo là mở candidate để xem context và xử lý công việc liên quan.

### Màn hình và trạng thái bắt buộc

1. Đăng ký / Đăng nhập
- Form đơn giản.
- States: default, loading, validation error, auth error, success.

2. Pipeline của tôi — màn hình chính
- Pipeline columns theo recruitment status.
- Candidate cards.
- Mỗi card hiển thị candidate name, Job/vị trí, status và các tín hiệu cần thiết.
- “Vừa cập nhật” dùng badge/icon + text.
- “Cần follow-up” dùng badge/icon + text.
- Có sync status/freshness rõ ràng.
- States: loading skeleton, empty, populated, sync error, partial/unmapped warning.
- Không thiết kế dashboard chart trung gian.

3. Chi tiết ứng viên
- Candidate information.
- Job liên quan.
- Current status.
- Update/follow-up context.
- States: default, loading, error, missing data.

4. Danh sách ứng viên
- Search/filter cơ bản.
- Candidate, Job, status, update/follow-up signals.
- States: default, loading, empty, error.

5. Jobs/JD
- Danh sách Job với title và context tối thiểu.
- Cho phép tạo/sửa Job.
- States: default, loading, empty, error.

6. Form tạo/sửa ứng viên và Job
- Label rõ.
- Inline validation.
- Saving, success và recoverable error.

### Component chính

AppShell, desktop sidebar/mobile navigation, PipelineBoard, PipelineColumn, CandidateCard, StatusBadge, UpdatedBadge, FollowUpBadge, SyncStatus, CandidateForm, JobForm, EmptyState, ErrorBanner và SearchFilterBar.

CandidateCard là component quan trọng nhất. Tạo hierarchy để người dùng scan name → follow-up/update → status → Job → metadata. Không phụ thuộc vào màu sắc để truyền tải trạng thái.

### Visual direction và design tokens

Phong cách: minimal SaaS, rõ ràng, tập trung, đáng tin. Nhiều khoảng thở, card gọn, hierarchy mạnh. Tránh enterprise dashboard dày chart, decoration thừa và shadow nặng.

Colors:
- Primary: #2563EB
- Primary dark: #1D4ED8
- Background: #F8FAFC
- Surface: #FFFFFF
- Text: #0F172A
- Muted text: #475569
- Border: #E2E8F0
- Follow-up accent: #D97706
- Success: #15803D
- Danger: #DC2626

Typography:
- Inter hoặc sans-serif tương đương.
- H1 24px/700.
- H2 18–20px/600.
- Body 14–16px.
- Label 13–14px/600.

Spacing scale: 4, 8, 12, 16, 24, 32, 48px.
Radius: 8px controls; 10–12px cards/panels.
Border nhẹ; elevation tối thiểu.
MVP dùng wordmark “Recruitment Pipeline”, chưa cần logo phức tạp.

### Layout và responsive

Desktop/laptop là trải nghiệm chính:
- Sidebar gọn.
- Main content rộng.
- Pipeline board chiếm phần lớn viewport.
- Cho phép horizontal scrolling nếu số status vượt chiều rộng.

Mobile:
- Không thu nhỏ nguyên board desktop.
- Hiển thị status theo section/tab/horizontal flow dễ kiểm soát.
- Candidate card full-width.
- Ưu tiên name, follow-up/update, status và Job; ẩn metadata phụ trước.
- Touch target khoảng 44×44px.

### Tương tác

- Sau login → Pipeline của tôi.
- Click candidate card → Candidate detail.
- Search/filter phải phản hồi rõ.
- Form validation hiển thị cạnh field và giữ input nếu submit lỗi.
- Loading board dùng skeleton.
- Syncing/synced/failed/stale phải có text rõ.
- Khi sync thất bại, vẫn giữ dữ liệu lần đồng bộ gần nhất và cảnh báo freshness.
- Primary CTA có focus, hover, pressed và disabled state.
- Không bắt buộc drag-and-drop để hoàn thành core user flow.

### Nội dung mẫu

Ngôn ngữ: Tiếng Việt.

Copy:
- “Pipeline của tôi”
- “Vừa cập nhật”
- “Cần follow-up”
- “Đã đồng bộ 10 phút trước”
- “Chưa thể cập nhật dữ liệu mới. Pipeline hiện đang hiển thị dữ liệu lần đồng bộ gần nhất.”
- “Chưa có ứng viên trong pipeline.”
- “Thêm ứng viên”
- “Thêm Job”
- “Thử đồng bộ lại”

Dùng tên ứng viên, công ty và Job giả hợp lý nhưng không đưa số liệu kinh doanh hoặc tuyên bố chưa được xác minh.

### Accessibility

- Tương phản text/control rõ.
- Keyboard navigation và focus ring đầy đủ.
- Form dùng label semantic.
- Badge quan trọng có text, không chỉ màu.
- Touch target phù hợp mobile.
- Tôn trọng reduced motion.

### Acceptance

- Pipeline là màn hình chính sau login.
- Candidate status, vừa cập nhật và cần follow-up scan được nhanh.
- Một primary CTA trong mỗi vùng quyết định.
- Loading, empty, error, success và sync failure đều được thiết kế.
- Mobile và desktop hoàn thành được core flow.
- Dữ liệu cũ không bị trình bày như dữ liệu mới khi sync lỗi.
- Không thêm agency management, multi-level permissions, AI matching, CRM đầy đủ, advanced analytics hoặc automation ngoài phạm vi MVP.
- Không giả định tên/status pipeline cụ thể nếu dữ liệu Google Sheet thực tế chưa xác minh; dùng status mẫu hợp lý và ghi chúng là sample data trong mockup.

Không thêm tính năng ngoài phạm vi MVP. Dùng dữ liệu giả hợp lý nhưng không bịa số liệu kinh doanh. Tạo mockup đủ chi tiết để một developer có thể triển khai.
