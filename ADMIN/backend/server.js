const express = require('express');
const cors = require('cors');
const path = require('path'); // Import thêm thư viện xử lý đường dẫn file
require('dotenv').config();

const app = express();
const allRoutes = require('./routes/index'); // Import file tổng hợp routes

// --- 1. CẤU HÌNH CORS (QUAN TRỌNG) ---
// // Cho phép Frontend (Port 5173) gọi API sang Backend (Port 5001)
// app.use(cors({
//     origin: 'http://localhost:5173', // Địa chỉ Frontend React của bạn
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các hành động cho phép
//     allowedHeaders: ['Content-Type', 'Authorization'], // Các header cho phép
//     credentials: true // Cho phép gửi kèm cookies/token (nếu cần thiết sau này)
// }));

// Cho phép MỌI nguồn truy cập (Dùng dấu * hoặc gọi cors() không tham số)
app.use(cors()); 

// HOẶC nếu muốn cấu hình kỹ hơn nhưng vẫn mở rộng:
/*
app.use(cors({
    origin: '*', // Cho phép tất cả các port (Admin, User đều vào được)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true 
}));
*/

// --- 2. MIDDLEWARE XỬ LÝ DỮ LIỆU ---
// Tăng giới hạn lên 50mb để upload ảnh/tài liệu không bị lỗi "Payload too large"
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- 3. CẤU HÌNH THƯ MỤC TĨNH (UPLOADS) ---
// Giúp Frontend hiển thị được ảnh/file từ thư mục 'uploads' của Backend
// Ví dụ: <img src="http://localhost:5001/uploads/avatar.jpg" />
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 4. ĐĂNG KÝ ROUTES ---
// Mọi API đều bắt đầu bằng /api
app.use('/api', allRoutes);

// --- 5. KHỞI CHẠY SERVER ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Admin Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📂 Thư mục uploads đã sẵn sàng phục vụ file tĩnh`);
});

// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// const allRoutes = require('./routes/index'); // <--- Import file tổng hợp

// // Middleware
// app.use(cors());
// app.use(express.json());

// // --- ĐĂNG KÝ ROUTES ---
// // Mọi API đều bắt đầu bằng /api
// // Ví dụ: /api/branch-admin/dashboard-stats
// app.use('/api', allRoutes);

// // Khởi chạy server (Port 5001)
// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => {
//   console.log(`🚀 Admin Server đang chạy tại http://localhost:${PORT}`);
// });