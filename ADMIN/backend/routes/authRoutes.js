const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 1. Route Đăng nhập (Public - Không cần token)
router.post('/login', authController.login);

// 1.1 Quên mật khẩu (Public - Không cần token)
router.post('/forgot-password', authController.forgotPassword);

// 2. Route Đổi mật khẩu (Private - Cần token)
// Dùng để Đảng viên/Bí thư tự đổi mật khẩu của mình
router.put('/reset-password/:id', verifyToken, authController.resetPassword);

// 3. Lấy hồ sơ cá nhân
router.get('/profile', verifyToken, authController.getProfile);

// 4. Cập nhật hồ sơ cá nhân
router.patch('/profile', verifyToken, authController.updateProfile);

// 5. Nâng cấp: Upload Avatar
router.post('/profile/avatar', verifyToken, upload.single('file'), authController.uploadAvatar);

// 6. [MỚI] Đổi mật khẩu bắt buộc (khi buoc_doi_mat_khau = true)
// User tự đổi mật khẩu tạm thành mật khẩu cá nhân — cờ sẽ tắt sau khi đổi thành công
router.post('/change-password-forced', verifyToken, authController.changePasswordForced);

module.exports = router;