const express = require('express');
const router = express.Router();
const branchDashboardController = require('../controllers/branchDashboardController');
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');

// Route lấy thống kê Dashboard
// Yêu cầu: Phải có Token và Phải là Admin Chi bộ (Role 2)
router.get('/dashboard-stats', verifyToken, branchDashboardController.getStats);

module.exports = router;