const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 1. Route Đăng nhập (Public - Không cần token)
router.post('/login', authController.login);

// 2. Route Đổi mật khẩu (Private - Cần token)
// Dùng để Đảng viên/Bí thư tự đổi mật khẩu của mình
router.put('/reset-password/:id', verifyToken, authController.resetPassword);

// 3. Lấy hồ sơ cá nhân
router.get('/profile', verifyToken, authController.getProfile);

// 4. Cập nhật hồ sơ cá nhân
router.patch('/profile', verifyToken, authController.updateProfile);

// 5. Nâng cấp: Upload Avatar
router.post('/profile/avatar', verifyToken, upload.single('file'), authController.uploadAvatar);

module.exports = router;