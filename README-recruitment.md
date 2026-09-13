# Recruitment Pipeline — Supabase

## Mở ứng dụng
Mở D:\DemoVibeCode\index.html bằng Chrome hoặc Edge và giữ kết nối Internet.
Đăng nhập bằng email/mật khẩu tài khoản của project Supabase cũ, hoặc chọn Đăng ký.
Sau khi đăng nhập: vào Jobs / JD → Thêm Job → trở lại Pipeline → Thêm ứng viên.
Thay đổi được lưu trên Supabase, có thể truy cập bằng cùng tài khoản trên thiết bị khác.

## Những gì đã kết nối
- Project cũ rkabffavdwtzmvgwxwxg đã được khởi động lại từ trạng thái tạm dừng.
- Supabase Auth: đăng ký, đăng nhập, khôi phục phiên và đăng xuất trên thiết bị hiện tại.
- Đọc/thêm/sửa Job và ứng viên bằng API thật; lỗi lưu giữ nguyên input.
- RLS theo owner_id và ràng buộc candidate/job cùng chủ sở hữu.
- Trạng thái thay đổi được database ghi timestamp. Dấu đã xem lưu theo tài khoản trên trình duyệt hiện tại.
- Không nạp dữ liệu mẫu hoặc tự tải localStorage cũ lên database.
- Dùng Supabase JS 2.116.0 qua CDN; chỉ publishable key trong HTML.
- CV ứng viên: có thể tải PDF, DOC hoặc DOCX (tối đa 10 MB). Mỗi file nằm trong vùng riêng tư của tài khoản; mở CV dùng đường dẫn tạm thời và không tạo link công khai.

## Dữ liệu cũ và bảng mới
Tài khoản cũ được dùng lại. Các bảng cũ jobs/candidates/applications/profiles và quyền admin cũ được giữ nguyên.
Tại thời điểm hoàn tất: 2 tài khoản, 3 Job và 2 ứng viên cũ còn nguyên.
Ứng dụng mới dùng recruitment_jobs, recruitment_candidates, recruitment_profiles và recruitment_sync_runs.
Workspace mới ban đầu trống. Hồ sơ cũ chưa được sao chép sang bảng mới.
recruitment_profiles và recruitment_sync_runs được chuẩn bị cho bước tiếp theo; hiện giao diện dùng danh tính Supabase Auth và chưa ghi profile/mã CTV hoặc sync run.
Mã CTV chưa tự cho người dùng nhận quyền; cần xác minh nguồn trước khi cấu hình mapping.

## Chưa kết nối
Google Sheet và quy tắc tự động follow-up chưa được cấu hình.
Sáu trạng thái khớp bộ trạng thái database cũ; mapping Google Sheet vẫn cần xác minh.
Không có deploy, upload CV, AI matching hoặc lịch sử trạng thái đầy đủ trong bản này.
Không có chuyển tự động dữ liệu demo cũ sang Supabase.

## Xác minh ngày 13/09/2026
- Đã kiểm tra API Auth thật: email login/signup được bật; cấu hình hiện tại tự xác nhận email (giữ nguyên cấu hình cũ).
- Kiểm tra LIVE với hai tài khoản tạm: đăng ký không gửi email, đăng nhập bằng trình duyệt, tạo Job/ứng viên, tải lại trang vẫn có dữ liệu, đổi trạng thái, badge, logout và đổi tài khoản. REST chứng minh tài khoản B không thấy dữ liệu A.
- Đã đăng xuất và xóa chính xác cả hai tài khoản tạm cùng dữ liệu test. Bảng mới trở lại trống; dữ liệu và tài khoản cũ giữ nguyên.
- Kiểm tra RLS trong transaction rollback: chủ sở hữu thêm/sửa được; người khác không đọc/sửa được; không gắn candidate vào Job của người khác; không đổi owner hoặc tự bật follow-up; anon không có quyền đọc.
- Kiểm tra browser với API fixture: lỗi đăng nhập, nhánh email confirmation, CRUD, reload, mark seen, lỗi tải/retry, logout xóa dữ liệu khỏi UI, hai tài khoản, mobile 390px không tràn ngang, không lỗi JS.
- Supabase security advisor không báo lỗi cho bảng mới. Có cảnh báo cấu hình Auth có sẵn: kiểm tra mật khẩu đã rò rỉ chưa bật. Không tự đổi cài đặt này. Tham khảo: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## File hỗ trợ
- work/index-local-backup.html: bản HTML cục bộ trước khi nối Supabase.
- work/recruitment-schema.sql: SQL đã áp dụng; KHÔNG chạy lại trên project đã có các bảng này.
- work/verify-rls.sql: kiểm thử database, rollback dữ liệu thử.
- work/verify-cloud-ui.cjs: kiểm thử giao diện với API giả lập; không ghi database thật.
- work/verify-live.cjs: kiểm thử tạo tài khoản/dữ liệu thật, chỉ dùng có kiểm soát và phải dọn test users sau khi chạy.
- work/auth-preview.png: ảnh màn hình đăng nhập thật.
- work/cloud-mobile-fixture.png: ảnh mobile dùng dữ liệu fixture để kiểm tra giao diện.
