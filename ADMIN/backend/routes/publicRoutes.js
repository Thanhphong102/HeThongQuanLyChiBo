const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Không có middleware verifyToken vì đây là Public Data
router.get('/landing/org-chart', publicController.getOrgChart);
router.get('/landing/process', publicController.getProcesses);

module.exports = router;
