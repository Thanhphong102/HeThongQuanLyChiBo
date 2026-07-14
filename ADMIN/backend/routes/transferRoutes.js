const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');

// --- GUIDELINES ROUTES ---
router.get('/guideline', verifyToken, transferController.getGuideline);
router.post('/guideline', verifyToken, isBranchAdmin, transferController.saveGuideline);

// --- USER (ĐẢNG VIÊN) ROUTES ---
// Lấy danh sách yêu cầu của bản thân
router.get('/my-requests', verifyToken, transferController.getMyTransferRequests);
// Chạy cron thủ công
router.post('/trigger-cron', transferController.triggerCron);
// Tạo mới yêu cầu
router.post('/', verifyToken, transferController.createTransferRequest);
// Nộp bổ sung hồ sơ
router.put('/:id/documents', verifyToken, transferController.addDocuments);
// Sửa thông tin
router.put('/:id', verifyToken, transferController.updateTransferRequest);
// Xóa tài liệu
router.delete('/:req_id/documents/:doc_id', verifyToken, transferController.deleteDocument);

// --- ADMIN (CHI ỦY) ROUTES ---
// Lấy danh sách toàn bộ yêu cầu trong Chi bộ
router.get('/', verifyToken, isBranchAdmin, transferController.getAllTransferRequests);
// Xem chi tiết yêu cầu
router.get('/:id', verifyToken, transferController.getTransferRequestDetail);
// Chi ủy đổi trạng thái yêu cầu
router.put('/:id/status', verifyToken, isBranchAdmin, transferController.updateRequestStatus);
// Đánh giá 1 tài liệu (Hợp lệ / Không hợp lệ)
router.put('/documents/:doc_id/review', verifyToken, isBranchAdmin, transferController.reviewDocument);

module.exports = router;
