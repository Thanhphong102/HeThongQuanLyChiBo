const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');

// Route: /api/dashboard/stats
router.get('/stats', verifyToken, isSuperAdmin, dashboardController.getStats);

module.exports = router;