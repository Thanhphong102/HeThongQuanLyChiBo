const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const branchRoutes = require('./branchRoutes');
const documentRoutes = require('./documentRoutes');
const targetRoutes = require('./targetRoutes');
const memberRoutes = require('./memberRoutes');
const newsRoutes = require('./newsRoutes');
const landingRoutes = require('./landingRoutes');

// Gắn prefix cho từng nhóm route
router.use('/auth', authRoutes);       
router.use('/dashboard', dashboardRoutes); 
router.use('/branches', branchRoutes);     
router.use('/documents', documentRoutes);  
router.use('/targets', targetRoutes);
router.use('/members', memberRoutes);
router.use('/news', newsRoutes);
router.use('/landing', landingRoutes);

module.exports = router;