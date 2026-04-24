const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');
const { verifyToken } = require('../middleware/authMiddleware');

// 1. Lấy danh sách chỉ tiêu được giao
router.get('/', verifyToken, targetController.getAssignedTargets);

// 2. Cập nhật tiến độ chỉ tiêu
router.put('/:id/progress', verifyToken, targetController.updateTargetProgress);

module.exports = router;
