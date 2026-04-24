2.1.1. Yêu cầu về chức năng của hệ thống
Hệ thống quản lý chi bộ được xây dựng với mục tiêu số hóa toàn diện các hoạt động Đảng vụ tại cơ sở, phân quyền chặt chẽ cho ba nhóm đối tượng (SuperAdmin, Admin, User). Các chức năng chính được phân bổ chi tiết như sau:

* Quản lý Hệ thống và Bảo mật Tài khoản
- Xác thực đa cấp: Hệ thống cung cấp các cổng đăng nhập chuyên biệt cho từng actor. Quy trình xác thực dựa trên giao thức JWT (JSON Web Token), đảm bảo tính toàn vẹn và bảo mật thông tin phiên làm việc.
- Phân quyền dựa trên vai trò (RBAC): Cấp 1 (Đảng ủy) có toàn quyền cấu trúc tổ chức và quản trị cấp cao. Cấp 2 (Admin chi bộ) quản lý trực tiếp Đảng viên và các hoạt động nội bộ. Cấp 3 (User) thực hiện tra cứu và tương tác cá nhân.
<!-- - Quản trị vòng đời tài khoản: Bao gồm các chức năng Khởi tạo, Phân quyền, Khóa/Mở khóa tài khoản. Đặc biệt, chức năng "Cấp lại mật khẩu" (Reset Password) được thiết kế theo quy trình bảo mật: Admin thực hiện đặt một mật khẩu tạm thời mới, hệ thống sẽ tiến hành băm (hash) mật khẩu này và ghi đè lên giá trị cũ trong cơ sở dữ liệu. Quy trình này đảm bảo tính an toàn vì ngay cả Admin cũng không thể truy xuất mật khẩu cũ của người dùng.
- Bảo mật mật khẩu: Sử dụng thuật toán Bcrypt để băm (hashing) mật khẩu một chiều kết hợp với cơ chế Salt. Vì đặc tính mã hóa một chiều, mật khẩu gốc sẽ không được lưu trữ dưới dạng văn bản thuần túy, do đó hệ thống không hỗ trợ chức năng "Lấy lại mật khẩu" mà chỉ hỗ trợ "Cấp lại mật khẩu mới". -->

* Quản lý Hồ sơ và Thông tin Đảng viên
- Hồ sơ điện tử chi tiết: Lưu trữ đồng bộ các thông tin từ lý lịch trích ngang, trình độ chuyên môn, quá trình công tác, đến lịch sử sinh hoạt Đảng.
- Nhập liệu thông minh (Excel Import): Cho phép tải lên danh sách Đảng viên hàng loạt từ tệp Excel. Hệ thống tích hợp cơ chế kiểm tra lỗi dữ liệu (validation) tự động trước khi ghi vào cơ sở dữ liệu chính thức.
- Bộ lọc và Tìm kiếm nâng cao: Hỗ trợ truy xuất thông tin Đảng viên theo đa tiêu chí: Đơn vị công tác, lớp sinh hoạt, giới tính, tình trạng (Chính thức/Dự bị) và chức vụ Đảng.
- Giám sát tình trạng Đảng viên: Hệ thống tự động phân loại và đưa ra cảnh báo (Notification/Warning) khi Đảng viên sắp hết thời gian dự bị hoặc có các biến động về hồ sơ chính trị.

* Quản lý Sinh hoạt và Hoạt động Đảng vụ
- Quy trình Sinh hoạt Chi bộ: Cho phép Chi ủy thiết lập kế hoạch họp định kỳ, đính kèm tài liệu nghiên cứu và gửi thông báo tự động đến từng Đảng viên qua hệ thống.
- Điểm danh và Biên bản số: Cung cấp giao diện điểm danh trực quan trong buổi họp. Dữ liệu vắng/có mặt được cập nhật tức thì. Biên bản cuộc họp được số hóa và lưu trữ lâu dài dưới dạng tệp tin hoặc văn bản văn phòng.
- Quản lý Hoạt động ngoại khóa (Events): Tổ chức các chương trình phong trào, tình nguyện. Đảng viên thực hiện "Đăng ký tham gia" và "Tải lên minh chứng" (ảnh hoặc PDF). Quản trị viên thực hiện "Phê duyệt minh chứng" để công nhận thành tích hoạt động của Đảng viên.

* Quản lý Chỉ tiêu và Tiến độ Công tác (KPIs)
- Phân bổ Chỉ tiêu: Đảng ủy trường thiết lập các định mức (Ví dụ: Số lượng kết nạp Đảng viên mới, số buổi sinh hoạt mẫu) cho từng đơn vị cụ thể theo năm học.
- Báo cáo và Theo dõi % Hoàn thành: Admin Chi bộ cập nhật kết quả đạt được. Hệ thống tự động tính toán tiến độ (%) dựa trên định mức ban đầu, cung cấp các biểu đồ trực quan (Dashboard) phục vụ công tác giám sát của Đảng ủy trường.

* Quản lý Tài chính và Tư liệu Đảng
- Quản lý Đảng phí: Theo dõi luồng thu nộp Đảng phí của Đảng viên, quản lý các khoản thu-chi nội bộ chi bộ đảm bảo tính minh bạch và chính xác theo quy định.
- Thư viện số và Biểu mẫu: Quản lý kho tư liệu bao gồm các mẫu đơn, nghị quyết, văn hóa chỉ đạo và kho media (ảnh/video) hoạt động. Dữ liệu được đồng bộ và lưu trữ an toàn thông qua kết nối Google Drive API.

2.1.2. Yêu cầu về phi chức năng của hệ thống
Hệ thống phải đáp ứng các tiêu chuẩn kỹ thuật nghiêm ngặt để đảm bảo vận hành ổn định trong môi trường thực tế:
- Hiệu năng (Performance): 
    + Khả năng chịu tải: Hệ thống phải hoạt động ổn định với tối thiểu 50 người dùng đồng thời thực hiện các tác vụ nặng (như truy xuất báo cáo, tải tài liệu).
    + Tốc độ phản hồi: Thời gian tải trang và xử lý yêu cầu API trung bình dưới 2 giây.
- Bảo mật (Security):
    + Mã hóa dữ liệu: Toàn bộ dữ liệu nhạy cảm được mã hóa trên đường truyền. Mật khẩu được bảo vệ bởi cơ chế Salt-Hashing mạnh mẽ.
    + Kiểm soát truy cập: Chặn các lỗ hổng OWASP phổ biến như SQL Injection, XSS và CSRF thông qua các lớp Middleware bảo mật.
- Tính tin cậy và Khả dụng (Reliability & Availability):
    + Sẵn sàng 24/7: Hệ thống có cơ chế xử lý lỗi (Graceful Degradation) để tránh sụp đổ toàn bộ khi một phân hệ gặp sự cố.
    + Sao lưu định kỳ: Dữ liệu được cấu hình sao lưu tự động (Auto-backup) hàng ngày lên nền tảng đám mây Supabase để đảm bảo an toàn tuyệt đối.
- Công nghệ nền tảng:
    + Framework: Kết hợp giữa ReactJS (Frontend) cho giao diện phản hồi nhanh và NodeJS (Backend) cho khả năng xử lý bất động bộ mạnh mẽ.
    + Cơ sở dữ liệu: PostgreSQL được quản lý bởi Supabase mang lại tính nhất quán và toàn vẹn dữ liệu cao.
    + Tích hợp dịch vụ bên thứ ba: Sử dụng Google Drive API để tối ưu hóa khả năng lưu trữ dữ liệu đa phương tiện lớn.
- Tính thân thiện và Tương thích: Giao diện thiết kế theo phong cách hiện đại (Ant Design), hỗ trợ hiển thị tốt trên đa thiết bị (Responsive Design: Desktop, Tablet, Mobile).

2.2.4. KẾT QUẢ VÀ THẢO LUẬN
	Nêu toàn bộ kết quả nghiên cứu tương ứng với các mục tiêu nghiên cứu đã đề ra. Nên sắp xếp các kết quả theo từng vấn đề một cách logic làm cho người đọc dễ theo dõi.
	Nêu nhận xét về các kết quả thu được, so sánh kết quả của tác giả với kết quả nghiên cứu của các tác giả đã nghiên cứu trước giải thích sự khác biệt nếu có hoặc giải thích, lý giải về các kết quả thu được.  
2.2.5. KẾT LUẬN VÀ KIẾN NGHỊ
	Phần kết luận: Kết luận về các nội dung nghiên cứu đã thực hiện. Đánh giá  những đóng góp mới của đề tài và khả năng ứng dụng của kết quả nghiên cứu.
	Phần kiến nghị: Các đề xuất được rút ra từ kết quả nghiên cứu. Đề xuất về các nghiên cứu tiếp theo; các biện pháp cần thiết để có thể ứng dụng kết quả nghiên cứu vào thực tiễn đời sống và sản xuất; các lĩnh vực nên ứng dụng hay sử dụng kết quả nghiên cứu; các kiến nghị về cơ chế, chính sách. 
Lưu ý sử dụng văn phông cho hợp lý cho bài báo cáo nghiên cứu khoa học

---

**PHẦN BÁO CÁO ĐƯỢC CHUYÊN GIA BIÊN SOẠN**

### 2.2.4. KẾT QUẢ VÀ THẢO LUẬN

**1. Kết quả đạt được**
Trong quá trình triển khai và hoàn thiện, đề tài đã đáp ứng các mục tiêu nghiên cứu cụ thể như sau:
* **Xây dựng thành công hệ thống phần mềm đa phân quyền (Multi-Actor Architecture):** Hệ thống đã hoàn thiện với 3 cụm Frontend - Backend độc lập dành cho 3 nhóm đối tượng: SuperAdmin (cấp Đảng ủy hoặc quản trị cấp cao), Admin (cấp Chi ủy/Bí thư chi bộ), và User (Đảng viên/Sinh viên). Điều này giúp chuyên môn hóa nghiệp vụ, tách biệt luồng dữ liệu và đảm bảo tính bảo mật.
* **Số hóa toàn diện dữ liệu Đảng viên và Chi bộ:** Dựa trên cấu trúc cơ sở dữ liệu quan hệ (PostgreSQL), hệ thống lưu trữ đồng bộ hồ sơ Đảng viên cá nhân, sơ đồ tổ chức chi bộ, quá trình xét kết nạp và quy trình Đảng. Từ đó, loại bỏ hồ sơ giấy, minh bạch thông tin và giảm sai sót trong lưu trữ.
* **Tự động hóa công tác tổ chức sinh hoạt chi bộ:** Module Lịch sinh hoạt và Điểm danh đã đi vào hoạt động, cho phép tạo các cuộc họp, đính kèm biên bản (file đính kèm) và thống kê tỷ lệ tham gia theo thời gian thực.
* **Quản lý tài chính và thành tích hoạt động:** Cung cấp tính năng quản lý việc thu nộp thu chi, đóng đảng phí. Đồng thời, module `dang_ky_hoat_dong` hỗ trợ Đảng viên tải lên minh chứng tham gia phong trào để Ban chi ủy đánh giá, xét chuẩn Đảng viên một cách công bằng.

**2.2.Thảo luận và nhận xét kết quả**
So với cách quản lý thủ công (ghi chép sổ sách) và các phương pháp ứng dụng công nghệ cơ bản (Excel/Google Sheets) thường thấy, giải pháp "Hệ thống quản lý chi bộ" mang lại sự khác biệt lớn về tính hệ thống và an toàn dữ liệu. 
* *Tính ưu việt:* Việc sử dụng hệ quản trị CSDL quan hệ kết hợp kiến trúc dịch vụ vi mô cho các cấp độ người dùng giúp tránh được tình trạng phân mảnh thông tin, trong khi vẫn duy trì sự giám sát từ cấp Đảng ủy.
* *Lý giải kết quả:* Kết quả này có được là nhờ sự áp dụng đúng đắn mô hình ReactJS tiên tiến tại phía Frontend và môi trường NodeJS mạnh mẽ phía Backend, đảm bảo giao diện thân thiện với Đảng viên (ngay cả cho người không rành công nghệ) nhưng tốc độ đáp ứng vẫn nhanh chóng, mượt mà.

### 2.2.5. KẾT LUẬN VÀ KIẾN NGHỊ

**1. Kết luận**
Nghiên cứu đã hoàn thành xuất sắc việc phân tích, thiết kế và lập trình hoàn thiện giải pháp "Hệ thống quản lý chi bộ". Đóng góp mới của đề tài nằm ở việc tạo ra một hệ sinh thái chuyển đổi số chuyên biệt cho mô hình quản lý Đảng vụ với cấu trúc phân tầng rõ ràng, đảm bảo quy định về tính bảo mật của tổ chức Đảng. Kết quả nghiên cứu có tính thực tiễn cao, giao diện phù hợp với người dùng, và hoàn toàn sẵn sàng triển khai thực tế. Giải pháp này nếu được áp dụng sẽ góp phần đẩy mạnh công cuộc chuyển đổi số trong các cơ quan nhà nước và trường đại học.

**2. Kiến nghị**
Từ kết quả nghiên cứu, nhóm tác giả đưa ra một số đề xuất và kiến nghị sau:
* **Khả năng ứng dụng thực tiễn:** Khuyến nghị cho phép triển khai chạy thí điểm (beta test) hệ thống tại một vài Chi bộ sinh viên hoặc Chi bộ cán bộ trong nhà trường. Sau một thời gian thu thập ý kiến phản hồi từ Bí thư chi bộ và Đảng viên, hệ thống có thể được tinh chỉnh và nhân rộng quy mô triển khai toàn trường.
* **Hướng nghiên cứu tiếp theo:** 
  - Khuyến nghị nghiên cứu áp dụng Trí tuệ nhân tạo (AI/OCR) vào quy trình đọc và kiểm duyệt tự động các hình ảnh minh chứng tham gia hoạt động, giúp giảm tải công tác xét duyệt cho chi ủy.
  - Tích hợp Chữ ký số điện tử (Digital Signature) vào quá trình phê duyệt biên bản, hồ sơ kết nạp Đảng, giúp số hóa hoàn toàn để văn bản có giá trị pháp lý.
  - Xây dựng ứng dụng trên nền tảng di động (Mobile App iOS/Android) kết hợp tính năng thông báo (Push Notifications) để các Đảng viên luôn được cập nhật lịch họp kịp thời.
  - Tích hợp dịch vụ gửi thông báo tự động (Email Service hoặc SMS OTP) để chuyển mật khẩu tạm thời đến Đảng viên sau khi Admin thực hiện Reset, giúp quy trình này trở nên khép kín, bảo mật và chuyên nghiệp hơn.
* **Đối với cơ chế, chính sách:** Đề nghị hỗ trợ cấp một máy chủ nội bộ an toàn với tường lửa bảo mật tại đơn vị triển khai hoặc đăng ký một Server chuyên dụng để làm hệ thống lưu trữ, nhằm đáp ứng nghiêm ngặt các tiêu chuẩn an toàn thông tin quản lý hồ sơ cơ bản của tổ chức Đảng.


