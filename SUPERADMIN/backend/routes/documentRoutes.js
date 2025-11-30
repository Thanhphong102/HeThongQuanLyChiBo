const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware'); // Nếu bạn tách multer ra file riêng
// Hoặc import multer trực tiếp ở đây nếu chưa tách

// Giả sử bạn import multer ở đây cho nhanh
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', verifyToken, isSuperAdmin, documentController.getDocuments);
router.post('/', verifyToken, isSuperAdmin, upload.single('file'), documentController.uploadDocument);
router.delete('/:id', verifyToken, isSuperAdmin, documentController.deleteDocument);

module.exports = router;