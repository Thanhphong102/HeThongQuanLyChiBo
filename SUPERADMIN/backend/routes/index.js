const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const branchRoutes = require('./branchRoutes');
const documentRoutes = require('./documentRoutes');
const targetRoutes = require('./targetRoutes');
const memberRoutes = require('./memberRoutes');
const newsRoutes = require('./newsRoutes');

// Gắn prefix cho từng nhóm route
router.use('/auth', authRoutes);       // -> /api/auth/login
router.use('/dashboard', dashboardRoutes); // -> /api/dashboard/stats
router.use('/branches', branchRoutes);     // -> /api/branches
router.use('/documents', documentRoutes);  // -> /api/documents
router.use('/targets', targetRoutes);
router.use('/members', memberRoutes);
router.use('/news', newsRoutes);

module.exports = router;