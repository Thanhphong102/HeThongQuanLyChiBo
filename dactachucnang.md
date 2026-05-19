2.1. Đặc tả yêu cầu 
2.1.1. Yêu cầu về chức năng của hệ thống
Hệ thống quản lý chi bộ được xây dựng với mục tiêu số hóa toàn diện các hoạt động Đảng vụ tại cơ sở, phân quyền chặt chẽ cho ba nhóm đối tượng (SuperAdmin, Admin, User). Các chức năng chính được phân bổ chi tiết như sau:

* Quản lý hệ thống và phân quyền
- Xác thực đa cấp: Hệ thống cung cấp các cổng đăng nhập chuyên biệt cho từng actor. Quy trình xác thực dựa trên giao thức JWT (JSON Web Token), đảm bảo tính toàn vẹn và bảo mật thông tin phiên làm việc.
- Phân quyền dựa trên vai trò (RBAC): Cấp 1 (Đảng ủy) có toàn quyền cấu trúc tổ chức và quản trị cấp cao. Cấp 2 (Admin chi bộ) quản lý trực tiếp Đảng viên và các hoạt động nội bộ. Cấp 3 (User) thực hiện tra cứu và tương tác cá nhân.
- Quản trị vòng đời tài khoản và Bảo mật mật khẩu: Bao gồm khởi tạo, khóa/mở khóa tài khoản. Đặc biệt, hệ thống tích hợp cơ chế tự động sinh mật khẩu ngẫu nhiên, mã hóa một chiều bằng thuật toán Bcrypt và gửi trực tiếp qua thư điện tử (Nodemailer). Hệ thống ép buộc Đảng viên phải đổi mật khẩu (Force Reset) ở lần đăng nhập đầu tiên nhằm đảm bảo an toàn thông tin tuyệt đối.

* Quản lý thông tin Đảng viên
- Hồ sơ điện tử chi tiết: Lưu trữ đồng bộ các thông tin từ lý lịch trích ngang, trình độ chuyên môn, đến quá trình sinh hoạt Đảng.
- Nhập liệu thông minh với Trí tuệ Nhân tạo (AI): Cho phép tải lên danh sách Đảng viên hàng loạt từ tệp Excel. Đặc biệt, hệ thống tích hợp bộ phân tích hồ sơ tự động bằng mô hình AI Llama 3.3, nhận diện và trích xuất thông tin từ văn bản thô thành dữ liệu có cấu trúc.
- Bộ lọc và Tìm kiếm nâng cao: Ứng dụng kỹ thuật tìm kiếm gần đúng (Fuzzy Search), hỗ trợ truy xuất linh hoạt thông tin Đảng viên không phân biệt dấu và sai sót nhỏ về chính tả, kết hợp lọc theo đa tiêu chí (đơn vị công tác, lớp, chức vụ).
- Hệ thống Cảnh báo sớm (Early Warning Dashboard): Tự động phân loại và đưa ra cảnh báo trực quan khi Đảng viên sắp hết thời gian dự bị (trên 11 tháng) hoặc có tỷ lệ nộp Đảng phí thấp, giúp cấp ủy kịp thời ra quyết định.

* Quản lý sinh hoạt Đảng và Hoạt động phong trào
- Quy trình Sinh hoạt Chi bộ: Cho phép Chi ủy thiết lập kế hoạch họp, đính kèm tài liệu nghiên cứu và gửi thông báo trực tiếp đến các Đảng viên.
- Điểm danh kép thông minh: Cung cấp cơ chế điểm danh kết hợp quét mã QR động mã hóa (thay đổi theo thời gian thực) và xác thực định vị GPS thông qua thuật toán Haversine (giới hạn bán kính 50m), ngăn chặn triệt để hành vi điểm danh hộ.
- Quản lý minh chứng hoạt động chống gian lận: Đảng viên đăng ký và tải lên hình ảnh minh chứng tham gia phong trào. Hệ thống tự động phân tích siêu dữ liệu hình ảnh (EXIF Metadata) để xác thực thời gian chụp thực tế, loại bỏ các minh chứng giả mạo trước khi cho phép duyệt.

* Quản lý Truyền thông, Tin tức và Kho Văn bản
- Quản lý Tin tức và Thông báo: Cung cấp nền tảng truyền thông nội bộ cho phép Ban Chi ủy đăng tải các bản tin, nghị quyết và thông báo khẩn. Hệ thống hỗ trợ định dạng văn bản đa dạng và đẩy thông báo (Push Notification/Alert) tức thời đến màn hình hiển thị của Đảng viên để đảm bảo thông tin được xuyên suốt.
- Lưu trữ Văn bản và Biểu mẫu điện tử: Số hóa hoàn toàn kho tệp tin hành chính (đơn xin vào Đảng, giấy chuyển sinh hoạt, nghị quyết...). Các biểu mẫu và văn bản được phân loại khoa học, tích hợp API của Google Drive để lưu trữ và tải xuống nhanh chóng, giảm tải băng thông lưu trữ cho máy chủ nội bộ.
- Thư viện số đa phương tiện: Quản lý kho hình ảnh hoạt động và thư viện video chuyên đề. Đặc biệt tích hợp luồng phát trực tiếp từ YouTube (YouTube iframe API) mang lại trải nghiệm xem video mượt mà, tối ưu hóa tốc độ tải trang.

* Quản lý Tài chính và Hỗ trợ Đảng viên
- Quản lý Đảng phí: Theo dõi luồng thu nộp Đảng phí hàng tháng của Đảng viên, phân loại trực quan tình trạng (Đã nộp/Chưa nộp), đảm bảo minh bạch tài chính.
- Trợ lý ảo AI (Dynamic RAG Chatbot): Tích hợp chatbot thông minh hỗ trợ giải đáp tự động các quy trình công tác Đảng. AI có khả năng truy vấn động dữ liệu thực tế từ cơ sở dữ liệu (thông tin Chi ủy, sơ đồ tổ chức) để cung cấp câu trả lời chính xác, sát thực với tình hình của từng Chi bộ.

2.1.2. Yêu cầu về phi chức năng của hệ thống
Hệ thống phải đáp ứng các tiêu chuẩn kỹ thuật nghiêm ngặt để đảm bảo vận hành ổn định trong môi trường thực tế:
- Hiệu năng (Performance)
+ Khả năng chịu tải: Hệ thống hoạt động ổn định với tối thiểu 50 người dùng đồng thời thực hiện các tác vụ truy vấn dữ liệu lớn và tải tài liệu.
+ Tốc độ phản hồi: Nhờ tối ưu hóa cơ sở dữ liệu và tích hợp API hiệu năng cao (Groq API cho AI), thời gian tải trang và xử lý yêu cầu trung bình dưới 2 giây.
- Bảo mật (Security)
+ Mã hóa và Xác thực: Hệ thống áp dụng quy trình bảo mật khép kín từ khâu cấp phát đến ép buộc đổi mật khẩu (Force Reset Password).
+ Kiểm soát truy cập: Tích hợp các lớp Middleware để ngăn chặn các lỗ hổng bảo mật chuẩn OWASP như SQL Injection, XSS và phân quyền truy cập trái phép.
- Tính tin cậy và Khả dụng (Reliability & Availability)
+ Kiến trúc độc lập: Thiết kế tách biệt 3 cụm Frontend-Backend (SuperAdmin, Admin, User) giúp hệ thống không bị sụp đổ toàn bộ khi một phân hệ gặp sự cố (Graceful Degradation).
+ Phục hồi dữ liệu: Cơ sở dữ liệu PostgreSQL được lưu trữ tập trung tại Supabase với cơ chế sao lưu tự động (Auto-backup) hàng ngày.
- Công nghệ nền tảng và Tương thích
+ Ngôn ngữ & Framework: Kết hợp ReactJS (Frontend) với giao diện Ant Design Responsive, và NodeJS/Express (Backend) xử lý bất đồng bộ mạnh mẽ.
+ Dịch vụ bên thứ ba: Tích hợp Google Drive API (lưu trữ), Nodemailer (Email), YouTube API (Media) và Groq API (LLM inference) giúp tối ưu hóa toàn diện sức mạnh hệ thống mà không tạo áp lực lên máy chủ nội bộ.
