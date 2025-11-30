const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');

// Import Multer để xử lý file từ form-data
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Routes (Base: /api/news)
router.get('/', verifyToken, isSuperAdmin, newsController.getNews);
router.post('/upload', verifyToken, isSuperAdmin, upload.single('image'), newsController.createNews); // Trường file tên là 'image'
router.put('/:id', verifyToken, isSuperAdmin, upload.single('image'), newsController.updateNews);
router.delete('/:id', verifyToken, isSuperAdmin, newsController.deleteNews);

module.exports = router;