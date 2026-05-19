const express = require('express');
const router = express.Router();
const { parseMemberFromText, chatWithBot } = require('../controllers/aiController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/ai/parse-member
// Yêu cầu đăng nhập mới được dùng tính năng AI
router.post('/parse-member', verifyToken, parseMemberFromText);

// POST /api/ai/chat
// Dành cho Chatbot hỗ trợ Đảng viên phía USER
router.post('/chat', verifyToken, chatWithBot);

module.exports = router;
