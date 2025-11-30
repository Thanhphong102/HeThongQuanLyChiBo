const express = require('express');
const router = express.Router();
const controller = require('../controllers/schoolDocumentController');
const { verifyToken } = require('../middleware/authMiddleware');

// Base URL: /api/school-documents

// Cho phép tất cả User đã đăng nhập (Cấp 2, 3) đều xem được
router.get('/', verifyToken, controller.getSchoolDocuments);

module.exports = router;