const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const allRoutes = require('./routes/index'); // Import file tổng hợp route

// Middleware
app.use(cors());
app.use(express.json());

// --- ROUTES ---
// Chỉ cần 1 dòng này để nạp tất cả API
app.use('/api', allRoutes);

// Khởi chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});