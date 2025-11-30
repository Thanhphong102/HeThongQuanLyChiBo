const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');

// Định nghĩa route gốc là / (sẽ được ghép thành /api/members)
router.get('/', verifyToken, isSuperAdmin, memberController.getAllMembers);

module.exports = router;