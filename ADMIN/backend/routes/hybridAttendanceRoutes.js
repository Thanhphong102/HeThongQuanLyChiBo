const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/hybridAttendanceController');
const auth    = require('../middleware/authMiddleware');

// Tất cả routes đều yêu cầu xác thực bằng Token (Đảng viên / Chi ủy)
router.use(auth.verifyToken);

// [Dành cho User] POST /api/hybrid-attendance/submit    → Gửi yêu cầu điểm danh bằng QR & Tọa độ
router.post('/submit', ctrl.submitHybridAttendance);

// [Dành cho Admin] POST /api/hybrid-attendance/:id/open   → Mở điểm danh (tạo token + lưu tọa độ)
router.post('/:id/open',  auth.isBranchAdmin, ctrl.openAttendance);

// [Dành cho Admin] POST /api/hybrid-attendance/:id/close  → Đóng điểm danh
router.post('/:id/close', auth.isBranchAdmin, ctrl.closeAttendance);

// GET  /api/hybrid-attendance/:id/qr    → Lấy thông tin QR hiện tại
router.get('/:id/qr',     ctrl.getQrInfo);

module.exports = router;
