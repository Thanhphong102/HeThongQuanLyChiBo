const express = require('express');
const router = express.Router();
const controller = require('../controllers/newsController');
// Tin tức là công khai, có thể không cần verifyToken nếu muốn khách vãng lai xem
// Nhưng ở đây ta cứ để verifyToken cho nhất quán với hệ thống nội bộ
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, controller.getNews);
router.get('/:id', verifyToken, controller.getNewsDetail);

module.exports = router;