const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', verifyToken, isSuperAdmin, authController.register);

// API Mới: Đổi mật khẩu & Khóa tài khoản
router.put('/reset-password/:id', verifyToken, isSuperAdmin, authController.resetPassword);
router.put('/toggle-status/:id', verifyToken, isSuperAdmin, authController.toggleStatus);
router.put('/update-role/:id', verifyToken, isSuperAdmin, authController.updateRole);

module.exports = router;