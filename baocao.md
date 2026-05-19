# NỘI DUNG CẬP NHẬT CHO BÁO CÁO NCKH (SAU GÓP Ý)

Dưới đây là các đoạn văn bản đã được tinh chỉnh chuyên nghiệp, bạn có thể copy trực tiếp vào các mục tương ứng trong file Word:

---

### 1. Về kiến trúc và lưu trữ (Mục 2.1.2)
"Hệ thống được thiết kế theo mô hình tách biệt giữa tầng ứng dụng và tầng dữ liệu để đảm bảo tính sẵn sàng cao. Giao diện (Frontend) được triển khai trên nền tảng Vercel, logic nghiệp vụ (Backend) vận hành trên Render. Toàn bộ dữ liệu thực thể và lịch sử giao dịch được lưu trữ tập trung tại hệ quản trị cơ sở dữ liệu PostgreSQL thông qua dịch vụ Supabase. Cơ chế sao lưu tự động (Auto-backup) hàng ngày được thực hiện tại tầng Database, đảm bảo an toàn dữ liệu độc lập với các sự cố tại tầng Hosting."

---

### 2. Về tính năng Audit Logs - Truy vết dữ liệu (Mục 2.4 & 2.1.2)
"Nhằm đảm bảo tính minh bạch và khả năng hậu kiểm theo yêu cầu của Đảng bộ, hệ thống tích hợp cơ chế **Audit Logs** toàn diện. Mỗi bản ghi trong các bảng dữ liệu cốt lõi (Chi bộ, Đảng viên, Tài chính, Hoạt động) đều được bổ sung các thuộc tính truy vết bao gồm: `created_at` (thời điểm khởi tạo), `updated_at` (thời điểm cập nhật cuối), `created_by` và `updated_by` (định danh người thực hiện). Điều này giúp Ban quản trị có thể xác định chính xác 'ai đã sửa gì, vào lúc nào', ngăn chặn các hành vi can thiệp dữ liệu trái phép."

---

### 3. Quy trình Đặt lại mật khẩu (Mục 2.6.4)
"Hệ thống thực thi chính sách bảo mật mật khẩu một chiều bằng thuật toán băm Bcrypt. Do tính chất không thể dịch ngược của mã băm, chức năng 'Cấp lại mật khẩu' được vận hành theo quy trình **Đặt lại mật khẩu tạm thời (Force Reset)**: 
1. Admin khởi tạo yêu cầu reset.
2. Hệ thống sinh mật khẩu ngẫu nhiên, băm mới và ghi đè vào cơ sở dữ liệu.
3. Mật khẩu tạm được gửi cho Đảng viên. 
4. Tại lần đăng nhập đầu tiên với mật khẩu tạm, hệ thống sẽ ép buộc người dùng thay đổi sang mật khẩu cá nhân mới để đảm bảo tính riêng tư tuyệt đối."

---

### 4. Điểm danh Offline và Online (Mục 2.6.5)
"Hệ thống điểm danh kép được tối ưu hóa cho hai hình thức sinh hoạt:
- **Sinh hoạt trực tiếp (Offline):** Sử dụng mã QR động kết hợp xác thực tọa độ GPS (Haversine Algorithm) trong bán kính 50m để đảm bảo sự hiện diện vật lý của Đảng viên tại hội trường.
- **Sinh hoạt trực tuyến (Online):** Áp dụng cho các cuộc họp qua Google Meet/Zoom. Hệ thống cho phép bỏ qua kiểm tra GPS nhưng vẫn yêu cầu quét mã QR động được trình chiếu trên màn hình họp. Mã QR này được gắn UUID biến đổi theo thời gian thực, ngăn chặn việc chụp ảnh và chia sẻ mã QR ra ngoài phạm vi buổi họp."

---

### 5. Chống gian lận minh chứng bằng EXIF Metadata (Mục 2.6.9)
"Để ngăn chặn việc sử dụng ảnh cũ hoặc ảnh giả mạo làm minh chứng hoạt động, hệ thống tích hợp công nghệ phân tích siêu dữ liệu hình ảnh (EXIF Parser). Khi Đảng viên tải lên minh chứng, Backend sẽ tự động trích xuất thông tin `DateTimeOriginal` (ngày giờ chụp thực tế) được nhúng trong tệp tin. Hệ thống sẽ so sánh dữ liệu này với thời gian diễn ra hoạt động; nếu ảnh được chụp trước khi sự kiện bắt đầu, hệ thống sẽ tự động từ chối và yêu cầu cung cấp minh chứng hợp lệ."

---

### 6. Hệ thống Cảnh báo sớm - DashBoard (Mục 2.6.2)
"Thay vì chỉ thống kê số liệu tĩnh, Dashboard của Admin được nâng cấp thành một trung tâm điều hành thông minh với tính năng **Cảnh báo sớm (Early Warning System)**:
- **Cảnh báo Đảng viên dự bị:** Tự động liệt kê danh sách Đảng viên đã có thời gian dự bị trên 11 tháng để Chi bộ kịp thời làm hồ sơ chuyển chính thức.
- **Cảnh báo nguồn thu:** Theo dõi tỷ lệ nộp Đảng phí trong tháng. Nếu tỷ lệ hoàn thành thấp (dưới 70%), hệ thống sẽ hiển thị cảnh báo đỏ nổi bật, giúp Bí thư chi bộ nhận diện nhanh các Chi bộ hoặc cá nhân cần đôn đốc nộp phí."

---

### 7. Tính năng AI nhập liệu thông minh (Mục quản lý Đảng viên)
"Hệ thống tích hợp công nghệ Trí tuệ nhân tạo (AI) thông qua việc gọi API đến mô hình ngôn ngữ lớn Llama 3 (qua nền tảng Groq). Chức năng này cho phép Admin chỉ cần sao chép và dán một đoạn văn bản thô chứa thông tin của Đảng viên. AI sẽ tự động phân tích ngôn ngữ tự nhiên (NLP) và trích xuất chính xác các trường dữ liệu như Họ tên, Mã số sinh viên, Ngày sinh, Quê quán, v.v., và tự động điền vào biểu mẫu. Giải pháp này giúp giảm thiểu sai sót do nhập liệu thủ công và tiết kiệm đáng kể thời gian trong công tác số hóa hồ sơ."

---

### 8. Chatbot AI Hỗ trợ Đảng viên (Mục chức năng phía User)
"Nhằm nâng cao chất lượng hỗ trợ và giải đáp thắc mắc cho Đảng viên, hệ thống triển khai một Chatbot AI thông minh (Trợ lý Chi bộ AI). Điểm đột phá của Chatbot này là việc tích hợp cơ chế RAG (Retrieval-Augmented Generation). Khi có truy vấn từ người dùng, Backend sẽ tự động truy xuất dữ liệu thực tế từ cơ sở dữ liệu (bao gồm thông tin Ban Chi ủy hiện tại, sơ đồ tổ chức, quy trình công tác) và cung cấp làm ngữ cảnh cho mô hình AI (Llama 3). Nhờ vậy, Trợ lý AI có thể đưa ra các câu trả lời chính xác, cập nhật theo thời gian thực về tình hình chi bộ và tránh được tình trạng "ảo giác" (hallucination) thường gặp ở các mô hình ngôn ngữ lớn."

---

### 9. Chức năng Quên mật khẩu tự động phía Đảng viên (Mục 2.7.2. Chức năng đăng nhập)
"Để giảm tải công việc cấp lại mật khẩu cho Admin Chi bộ, phân hệ User được bổ sung tính năng 'Quên mật khẩu' hoàn toàn tự động. Khi Đảng viên cung cấp email hợp lệ đã đăng ký, hệ thống sẽ sinh ra một mật khẩu tạm thời ngẫu nhiên (chứa ký tự đặc biệt, số và chữ cái) và băm an toàn bằng thuật toán Bcrypt. Mật khẩu này được gửi trực tiếp đến hộp thư của người dùng thông qua dịch vụ giao thức SMTP (Nodemailer). Cơ chế 'Ép đổi mật khẩu' (Force Password Reset) sẽ được kích hoạt ngay ở lần đăng nhập tiếp theo với mật khẩu tạm, đảm bảo tính bảo mật và riêng tư cao nhất cho Đảng viên."
