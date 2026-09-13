# Project Overview & PRD — Recruitment Pipeline

**Trạng thái:** Draft  
**Ngày:** 2026-09-11  
**Phiên bản:** MVP  

## 1. Tổng quan sản phẩm

- **Tên sản phẩm:** Recruitment Pipeline (tên tạm thời)
- **Mô tả một câu:** Web app responsive giúp CTV tuyển dụng/freelancer tập trung Job/JD, quản lý ứng viên và xem pipeline cá nhân được cập nhật từ dữ liệu tuyển dụng chung.
- **Đối tượng người dùng:** CTV tuyển dụng/freelancer làm việc với các công ty headhunt và cùng lúc phụ trách nhiều vị trí tuyển dụng.
- **Hành động quan trọng nhất:** Mở ứng dụng để xem toàn bộ ứng viên của mình trên một pipeline duy nhất.

## 2. Câu định vị MVP

> Tôi tạo ra **Recruitment Pipeline** dành cho **CTV tuyển dụng/freelancer làm việc với công ty headhunt** để giúp họ **theo dõi toàn bộ ứng viên của mình trên một pipeline tự cập nhật**.

## 3. Người dùng và bối cảnh

- **Người dùng chính:** CTV tuyển dụng/freelancer làm việc độc lập với các công ty headhunt.
- **Tình huống sử dụng:** Người dùng cùng lúc phụ trách nhiều vị trí; JD nằm ở nhiều Google Docs, dữ liệu ứng viên được lưu riêng và trạng thái tuyển dụng được cập nhật trên một Google Sheet chung có nhiều CTV.
- **Động lực:** Muốn biết nhanh ứng viên nào đang ở giai đoạn nào, ai vừa thay đổi trạng thái và ai cần follow-up tiếp.
- **Rào cản:** Dữ liệu nằm ở nhiều nơi; việc kiểm tra Sheet chung bằng Ctrl+F tốn thời gian; chưa xác minh cách hệ thống có thể nhận diện và đồng bộ đúng ứng viên của từng CTV.

## 4. Vấn đề cần giải quyết

- **Nỗi đau chính:** Người dùng mất nhiều thời gian kiểm tra thủ công trạng thái từng ứng viên trên Sheet chung, khó nhìn toàn bộ pipeline và dễ bỏ sót ứng viên cần follow-up.
- **Cách làm hiện tại:** Tìm JD trong nhiều Google Docs, lưu ứng viên vào file cá nhân và Ctrl+F từng ứng viên trên Google Sheet chung để kiểm tra trạng thái.
- **Vì sao cách hiện tại chưa tốt:** Thông tin phân tán, nhiều thao tác lặp lại và không có một góc nhìn riêng cho pipeline của từng CTV.
- **Bằng chứng:** `CHƯA ĐỦ DỮ LIỆU` — vấn đề hiện được xác định từ trải nghiệm/mô tả của chủ sản phẩm, chưa có kiểm chứng với nhiều CTV khác.

## 5. Job To Be Done

> Khi tôi đang phụ trách nhiều ứng viên cho nhiều vị trí tuyển dụng, tôi muốn mở một nơi duy nhất để xem trạng thái pipeline của các ứng viên thuộc mình, để biết ai vừa thay đổi và ai cần follow-up mà không phải tìm từng người trên Sheet chung.

## 6. Giá trị sản phẩm

- **Giá trị cốt lõi:** Biến dữ liệu trạng thái phân tán trên Sheet chung thành một pipeline cá nhân dễ theo dõi và hành động.
- **Điểm khác biệt có thể kiểm chứng:** Người dùng có thể xem các thay đổi trạng thái liên quan đến ứng viên của mình mà không phải Ctrl+F từng người trên Sheet chung.
- **Giả định quan trọng nhất:** Dữ liệu nguồn cho phép xác định ổn định ứng viên thuộc CTV nào và trạng thái hiện tại của ứng viên đó.

## 7. Core user flow

1. Người dùng đăng ký hoặc đăng nhập vào tài khoản cá nhân.
2. Hệ thống hiển thị các ứng viên thuộc workspace của người dùng và trạng thái tuyển dụng hiện tại.
3. Hệ thống đồng bộ dữ liệu trạng thái từ nguồn Google Sheet chung và nhận biết thay đổi mới.
4. Người dùng mở pipeline để xem ứng viên theo từng giai đoạn.
5. Người dùng nhận biết ứng viên vừa cập nhật và những trường hợp cần follow-up tiếp theo.
6. Người dùng mở thông tin ứng viên/Job liên quan để thực hiện công việc tiếp theo.

## 8. Functional requirements

### P0 — Bắt buộc cho MVP

- **FR-01 — Tài khoản cá nhân:** Người dùng phải có thể đăng ký, đăng nhập và chỉ truy cập dữ liệu thuộc không gian làm việc của mình.
- **FR-02 — Quản lý Job/JD cơ bản:** Người dùng phải có thể lưu thông tin Job/JD tối thiểu cần thiết để biết ứng viên đang được giới thiệu cho vị trí nào.
- **FR-03 — Quản lý ứng viên:** Người dùng phải có thể lưu và xem danh sách ứng viên của mình, với liên kết tới Job phù hợp.
- **FR-04 — Pipeline cá nhân:** Hệ thống phải hiển thị ứng viên theo trạng thái/giai đoạn tuyển dụng trên một pipeline duy nhất.
- **FR-05 — Đồng bộ trạng thái:** Khi dữ liệu trạng thái của ứng viên thay đổi trong nguồn Google Sheet chung, hệ thống phải có cơ chế cập nhật trạng thái tương ứng trong pipeline cá nhân.
- **FR-06 — Nhận biết cập nhật mới:** Hệ thống phải giúp người dùng phân biệt ứng viên có trạng thái vừa thay đổi so với lần kiểm tra trước.
- **FR-07 — Follow-up:** Hệ thống phải giúp người dùng nhận biết ứng viên cần xử lý/follow-up tiếp theo theo quy tắc MVP đã được chốt.
- **FR-08 — Cô lập dữ liệu người dùng:** Một CTV không được xem workspace và dữ liệu riêng của CTV khác qua giao diện sản phẩm.

### P1 — Có thể làm sau khi P0 ổn định

- **FR-09 — Lịch sử trạng thái:** Xem timeline chi tiết các lần thay đổi trạng thái của ứng viên.
- **FR-10 — Thông báo:** Chủ động thông báo khi có thay đổi quan trọng thay vì yêu cầu người dùng mở dashboard.
- **FR-11 — Quản lý follow-up nâng cao:** Deadline, ghi chú và danh sách công việc follow-up chi tiết.

## 9. Scope

### IN — MVP làm

- Web app responsive.
- Đăng ký và đăng nhập cho nhiều CTV.
- Workspace/dữ liệu riêng theo người dùng.
- Job/JD ở mức đủ để gắn ứng viên với vị trí.
- Quản lý ứng viên cá nhân.
- Pipeline ứng viên.
- Đồng bộ trạng thái từ Google Sheet chung, với điều kiện khả thi kỹ thuật được xác minh.
- Nhận biết trạng thái vừa cập nhật.
- Xác định/hiển thị ứng viên cần follow-up theo quy tắc MVP.

### OUT — Chưa làm

- Dashboard quản trị agency/team.
- Phân quyền nhiều cấp.
- AI matching ứng viên với Job.
- CRM khách hàng đầy đủ.
- Automation tuyển dụng phức tạp.
- Hệ thống notification đa kênh.
- Analytics/reporting nâng cao.

### Non-goals — Cố tình không giải quyết

- Thay thế toàn bộ hệ thống ATS của công ty headhunt.
- Quản lý quy trình nội bộ của agency.
- Tự động ra quyết định tuyển dụng.
- Tự động đánh giá chất lượng ứng viên bằng AI.

## 10. Success criteria và validation

| Success criterion | Cách kiểm chứng | Tín hiệu đạt |
|---|---|---|
| Người dùng có thể xem pipeline cá nhân mà không tìm từng ứng viên trên Sheet chung | Cho CTV thực hiện tác vụ kiểm tra trạng thái bằng app trong buổi test | Có thể xác định trạng thái các ứng viên được giao mà không cần Ctrl+F Sheet |
| Dữ liệu đồng bộ map đúng về CTV và ứng viên | So sánh mẫu dữ liệu trên app với dữ liệu nguồn | Các bản ghi trong mẫu kiểm thử khớp đúng CTV, ứng viên và trạng thái nguồn |
| Thay đổi trạng thái được nhận biết | Thay đổi trạng thái trong dữ liệu test rồi chạy cơ chế đồng bộ | App thể hiện đúng ứng viên có trạng thái mới |
| Người dùng nhận biết trường hợp cần follow-up | Đưa một tập pipeline mẫu và yêu cầu người dùng chỉ ra việc cần xử lý | Người dùng xác định được các trường hợp cần xử lý dựa trên tín hiệu của app |
| Giá trị thực tế với CTV khác chủ sản phẩm | Cho một nhóm nhỏ CTV mục tiêu dùng thử | `CHƯA ĐỦ DỮ LIỆU` để đặt ngưỡng số lượng/tỷ lệ; cần thu feedback thực tế trước |

## 11. Edge cases quan trọng

- **Khi input trống hoặc sai:** Không tạo Job/ứng viên không hợp lệ; hiển thị rõ trường cần sửa.
- **Khi không có dữ liệu:** Pipeline hiển thị empty state và hướng dẫn bước tiếp theo thay vì màn hình trống.
- **Khi thao tác thất bại:** Giữ dữ liệu người dùng đã nhập khi có thể và cung cấp cách thử lại.
- **Khi đồng bộ thất bại:** Không ghi đè trạng thái hiện tại bằng dữ liệu không xác định; hiển thị tình trạng đồng bộ để người dùng không hiểu nhầm dữ liệu là mới nhất.
- **Khi không map được ứng viên:** Đánh dấu bản ghi cần xử lý thay vì tự ghép với một ứng viên không chắc chắn.
- **Khi dữ liệu nguồn trùng ứng viên:** Không tự hợp nhất nếu chưa có khóa nhận diện đáng tin cậy.
- **Khi dùng trên màn hình nhỏ:** Core flow xem pipeline, cập nhật mới và follow-up vẫn phải hoàn thành được.

## 12. Ràng buộc và dependency

- **Nền tảng:** Web app responsive.
- **Thời gian/ngân sách/kỹ năng:** Chưa cung cấp giới hạn cụ thể; ưu tiên phạm vi nhỏ phù hợp người mới vibecode.
- **Dữ liệu:** Phụ thuộc cấu trúc thực tế của Google Sheet chung và dữ liệu do người dùng quản lý trong workspace.
- **Tích hợp:** Google Sheet là dependency quan trọng nhất; cách truy cập, nhận diện CTV, nhận diện ứng viên và tần suất đồng bộ chưa được xác minh.
- **Bảo mật hoặc quyền riêng tư:** Dữ liệu ứng viên có thể chứa thông tin cá nhân. MVP phải cô lập dữ liệu giữa các tài khoản và không để một CTV truy cập dữ liệu riêng của CTV khác.

## 13. Rủi ro và giả định

| Loại | Nội dung | Cách giảm rủi ro/kiểm chứng |
|---|---|---|
| Giả định | Google Sheet có trường hoặc quy tắc đủ ổn định để xác định ứng viên thuộc CTV nào | Kiểm tra cấu trúc và dữ liệu mẫu thực tế trước khi triển khai sync |
| Giả định | Có thể nhận diện cùng một ứng viên giữa workspace cá nhân và Sheet chung | Xác định khóa nhận diện đáng tin cậy từ dữ liệu thực tế |
| Giả định | Trạng thái trong Sheet có cấu trúc đủ nhất quán để map thành pipeline | Liệt kê toàn bộ status thực tế và lập bảng mapping |
| Giả định | Pipeline tự cập nhật giải quyết pain cho các CTV khác | Test MVP với CTV mục tiêu ngoài chủ sản phẩm |
| Rủi ro | Quyền truy cập Google Sheet không cho phép tích hợp như dự kiến | Xác minh quyền và phương thức truy cập trước khi code integration |
| Rủi ro | Sheet thay đổi cấu trúc làm sync lỗi | Giới hạn contract dữ liệu và có trạng thái lỗi sync rõ ràng |
| Rủi ro | Dữ liệu của nhiều CTV bị hiển thị nhầm | Thiết kế isolation theo user và kiểm thử quyền truy cập trước khi thử nghiệm thật |

## 14. Câu hỏi còn mở

- [ ] Google Sheet chung hiện có những cột nào?
- [ ] Trường nào xác định ứng viên thuộc CTV nào?
- [ ] Có định danh ứng viên ổn định như email, số điện thoại hoặc ID riêng không?
- [ ] Các trạng thái tuyển dụng thực tế đang được dùng là gì?
- [ ] “Cần follow-up” được xác định theo trạng thái, thời gian không có cập nhật hay thao tác thủ công?
- [ ] Ứng dụng được phép truy cập Sheet bằng phương thức nào và với quyền gì?
- [ ] Cần đồng bộ gần thời gian thực hay đồng bộ theo chu kỳ là đủ?
- [ ] Job/JD trong MVP sẽ được nhập thủ công, lưu link Google Docs hay cần đồng bộ từ nguồn khác?

## 15. Điều kiện sẵn sàng sang Design

- [x] Một người dùng chính đã được chốt.
- [x] Một hành động chính đã được chốt.
- [x] P0 và OUT scope không mâu thuẫn ở mức product requirement.
- [x] Mỗi success criterion có cách kiểm chứng.
- [x] Giả định chưa có bằng chứng đã được đánh dấu.
- [ ] Dependency Google Sheet cần được kiểm chứng trước khi coi cơ chế sync là khả thi kỹ thuật.
