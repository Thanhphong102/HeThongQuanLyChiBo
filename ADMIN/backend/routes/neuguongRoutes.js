const express = require('express');
const router = express.Router();
const neuguongController = require('../controllers/neuguongController');
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');

// ============================================================
// ADMIN (CHI ỦY) ROUTES — Yêu cầu quyền cấp 2
// ============================================================

// Quản lý Đợt nêu gương
router.get('/dots',            verifyToken, isBranchAdmin, neuguongController.getAllDots);       // Lấy tất cả đợt
router.post('/dots',           verifyToken, isBranchAdmin, neuguongController.createDot);        // Tạo đợt mới
router.put('/dots/:id',        verifyToken, isBranchAdmin, neuguongController.updateDot);        // Cập nhật/Đóng đợt
router.delete('/dots/:id',     verifyToken, isBranchAdmin, neuguongController.deleteDot);        // Xóa đợt

// Quản lý Hồ sơ trong đợt
router.get('/dots/:dot_id/ho-so',          verifyToken, isBranchAdmin, neuguongController.getHoSoByDot);    // DS hồ sơ theo đợt
router.put('/ho-so/:id/duyet',             verifyToken, isBranchAdmin, neuguongController.duyetHoSo);        // Duyệt lần 1
router.put('/ho-so/:id/tu-choi',           verifyToken, isBranchAdmin, neuguongController.tuChoiHoSo);       // Từ chối
router.put('/ho-so/:id/cong-nhan',         verifyToken, isBranchAdmin, neuguongController.congNhanHoSo);     // Công nhận cuối

// ============================================================
// USER (ĐẢNG VIÊN) ROUTES — Chỉ cần đăng nhập
// ============================================================

// Lấy đợt nêu gương hiện tại + trạng thái hồ sơ của mình
router.get('/my-dots',             verifyToken, neuguongController.getDotDangMo);

// Nộp hồ sơ mới
router.post('/nop-ho-so',          verifyToken, neuguongController.nopHoSo);

// Nộp file báo cáo (Bước 2)
router.post('/nop-bao-cao',        verifyToken, neuguongController.nopBaoCao);

// Xem chi tiết hồ sơ của mình
router.get('/my-ho-so/:ma_ho_so',  verifyToken, neuguongController.getMyHoSo);

module.exports = router;
