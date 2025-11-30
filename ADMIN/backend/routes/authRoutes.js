const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// 1. Route Đăng nhập (Public - Không cần token)
router.post('/login', authController.login);

// 2. Route Đổi mật khẩu (Private - Cần token)
// Dùng để Đảng viên/Bí thư tự đổi mật khẩu của mình
router.put('/reset-password/:id', verifyToken, authController.resetPassword);

module.exports = router;