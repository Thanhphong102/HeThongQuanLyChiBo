const express = require('express');
const router = express.Router();
const controller = require('../controllers/branchFeeController');
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');

// 1. GET: Cho phép Đảng viên vào xem (Controller cần lọc theo ID người dùng nếu là cấp 3)
router.get('/', verifyToken, controller.getFeeData);

// 2. Các chức năng thu tiền/chi tiêu: Giữ nguyên Admin
router.post('/toggle', verifyToken, isBranchAdmin, controller.togglePayment);
router.put('/fee-level', verifyToken, isBranchAdmin, controller.updateFeeLevel);

// Quản lý Chi
router.post('/expense', verifyToken, isBranchAdmin, controller.createExpense);
router.put('/expense/:id', verifyToken, isBranchAdmin, controller.updateExpense);
router.delete('/expense/:id', verifyToken, isBranchAdmin, controller.deleteExpense);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const controller = require('../controllers/branchFeeController');
// const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');

// router.get('/', verifyToken, isBranchAdmin, controller.getFeeData);
// router.post('/toggle', verifyToken, isBranchAdmin, controller.togglePayment);
// router.put('/fee-level', verifyToken, isBranchAdmin, controller.updateFeeLevel);

// // Quản lý Chi
// router.post('/expense', verifyToken, isBranchAdmin, controller.createExpense);
// router.put('/expense/:id', verifyToken, isBranchAdmin, controller.updateExpense); // <--- MỚI
// router.delete('/expense/:id', verifyToken, isBranchAdmin, controller.deleteExpense);

// module.exports = router;