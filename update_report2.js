const fs = require("fs");
let text = fs.readFileSync("Bao_cao_NCKH.txt", "utf8");

text = text.replace(/\n2\.7\.(?=\s|\d)/g, "\n2.8.");
text = text.replace(/\n2\.6\.(?=\s|\d)/g, "\n2.7.");
text = text.replace(/\n2\.5\.(?=\s|\d)/g, "\n2.6.");

const newSectionContent = `2.5. PHÂN TÍCH NGHIỆP VỤ VÀ LỰA CHỌN KIẾN TRÚC
2.5.1. Phân tích nghiệp vụ trước khi đưa ra giải pháp
Trước khi thiết kế hệ thống, nhóm nghiên cứu đã tiến hành khảo sát thực trạng công tác quản lý chi bộ tại Trường Đại học Kỹ thuật - Công nghệ Cần Thơ. Thực trạng cho thấy các bất cập sau:
- Quản lý hồ sơ và biến động Đảng viên: Hiện tại việc lưu trữ lý lịch trích ngang, theo dõi thời gian chuyển Đảng chính thức hay sinh hoạt phí chủ yếu làm trên Excel hoặc sổ sách thủ công. Việc này dễ dẫn đến sai sót, chậm trễ trong việc nhắc nhở các mốc thời gian quan trọng (ví dụ hết 12 tháng dự bị).
- Sinh hoạt và điểm danh: Điểm danh qua giấy hoặc qua biểu mẫu Google Form dễ xảy ra tình trạng "điểm danh hộ", không đảm bảo tính kỷ luật và sự hiện diện thực tế của Đảng viên trong các buổi sinh hoạt chuyên đề.
- Quản lý minh chứng và chỉ tiêu: Đảng ủy giao chỉ tiêu xuống Chi bộ, nhưng việc báo cáo tiến độ và nộp minh chứng (hình ảnh tham gia phong trào, nghị quyết) chưa có hệ thống tập trung. Minh chứng gửi qua Zalo/Email dễ trôi tin và khó thẩm định tính xác thực của hình ảnh.
Từ những bài toán nghiệp vụ trên, hệ thống cần một giải pháp công nghệ có khả năng: số hóa hồ sơ, tự động nhắc nhở, chống gian lận điểm danh (qua tọa độ), chống gian lận minh chứng (qua phân tích siêu dữ liệu ảnh), và cung cấp dashboard thống kê thời gian thực cho cấp lãnh đạo.

2.5.2. So sánh phương án thiết kế và lựa chọn kiến trúc
a) Lựa chọn kiến trúc tổng thể (Architecture)
- Phương án 1: Kiến trúc Monolithic truyền thống (Giao diện và Logic nghiệp vụ nằm chung một khối code). Ưu điểm: Dễ phát triển ban đầu. Nhược điểm: Khó mở rộng, nếu một module (ví dụ module điểm danh) quá tải sẽ làm sập toàn bộ hệ thống.
- Phương án 2: Kiến trúc tách rời Frontend - Backend qua RESTful API, triển khai độc lập (Multi-tier Architecture). Ưu điểm: Phân tách rõ ràng giữa giao diện và xử lý dữ liệu, dễ bảo trì, tính sẵn sàng cao (Graceful Degradation).
=> Quyết định: Nhóm chọn Phương án 2, thiết kế hệ thống tách biệt thành Frontend (ReactJS) và Backend (NodeJS/Express). Điều này phù hợp với mô hình 3 actor (SuperAdmin, Admin, User), giúp cách ly dữ liệu và bảo mật luồng truy cập độc lập.

b) Lựa chọn Hệ quản trị Cơ sở dữ liệu
- Phương án 1: Cơ sở dữ liệu phi quan hệ (NoSQL - MongoDB). Phù hợp với dữ liệu phi cấu trúc, linh hoạt.
- Phương án 2: Cơ sở dữ liệu quan hệ (RDBMS - PostgreSQL). Hỗ trợ ACID, ràng buộc khóa ngoại chặt chẽ.
=> Quyết định: Quản lý Đảng viên, Chi bộ, Chỉ tiêu và Thu/Chi Đảng phí là các thực thể có mối quan hệ ràng buộc khắt khe (Relational). Cần tính toàn vẹn dữ liệu cực cao (không thể xảy ra tình trạng thiếu dữ liệu cha). Do đó, PostgreSQL được lựa chọn làm hệ quản trị cơ sở dữ liệu chính.

c) Lựa chọn giải pháp điểm danh chống gian lận
- Phương án 1: Chỉ dùng mã QR tĩnh hoặc danh sách điểm danh truyền thống. Nhược điểm: Đảng viên có thể chụp ảnh QR gửi cho người khác quét, không xác thực được vị trí thực tế.
- Phương án 2: Hybrid Attendance (Mã QR động + Xác thực Geolocation).
=> Quyết định: Lựa chọn Phương án 2. Hệ thống tạo mã QR động (thay đổi mỗi 100 giây) kết hợp với thuật toán tính khoảng cách Haversine từ tọa độ GPS của thiết bị đến tâm hội trường. Giải pháp này triệt tiêu hoàn toàn khả năng điểm danh hộ.

d) Lựa chọn giải pháp lưu trữ tài liệu (Storage)
- Phương án 1: Lưu trữ file trực tiếp trên ổ cứng máy chủ Backend (Local Storage). Tốn tài nguyên băng thông, dễ tràn ổ đĩa, chi phí duy trì server lớn.
- Phương án 2: Sử dụng giải pháp Cloud Storage bên thứ 3.
=> Quyết định: Chọn Google Drive API làm Object Storage để lưu trữ văn bản và hình ảnh hoạt động. Cơ sở dữ liệu nội bộ chỉ lưu trữ định danh (File ID), giúp hệ thống hoạt động mượt mà, tốc độ tải trang nhanh và tận dụng tốt tài nguyên đám mây miễn phí cho giáo dục.

e) Tích hợp Trí tuệ nhân tạo (AI) trong phân tích dữ liệu
- Khi nhập liệu hồ sơ Đảng viên mới, thao tác thủ công rất tốn thời gian. Thay vì dùng biểu thức chính quy (Regex) kém linh hoạt, hệ thống quyết định tích hợp API của mô hình Llama 3 (qua nền tảng Groq). Mô hình LLM đóng vai trò xử lý ngôn ngữ tự nhiên, tự động trích xuất các thực thể (Entity Extraction) từ một đoạn mô tả thô (Họ tên, quê quán, ngày vào Đảng) và điền tự động vào Form, cải thiện đáng kể năng suất xử lý công việc hành chính.

`;

// Find first occurrence of 2.6. HỆ THỐNG in TOC
const tocIndex = text.indexOf("\n2.6. HỆ THỐNG");
if (tocIndex !== -1) {
    const tocAddition = `2.5. PHÂN TÍCH NGHIỆP VỤ VÀ LỰA CHỌN KIẾN TRÚC25\n2.5.1. Phân tích nghiệp vụ trước khi đưa ra giải pháp25\n2.5.2. So sánh phương án thiết kế và lựa chọn kiến trúc25\n`;
    text = text.substring(0, tocIndex) + "\n" + tocAddition + "2.6. HỆ THỐNG" + text.substring(tocIndex + 14);
}

// Find second occurrence (which is the actual body section)
const bodyIndex = text.indexOf("\n2.6. HỆ THỐNG", tocIndex + 10);
if (bodyIndex !== -1) {
    text = text.substring(0, bodyIndex) + "\n" + newSectionContent + "2.6. HỆ THỐNG" + text.substring(bodyIndex + 14);
}

fs.writeFileSync("Bao_cao_NCKH_updated.txt", text, "utf8");
console.log("Done");
