const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const branchRoutes = require('./branchRoutes');
const branchMemberRoutes = require('./branchMemberRoutes');
const activityRoutes = require('./activityRoutes');
const branchFeeRoutes = require('./branchFeeRoutes');
const branchFormRoutes = require('./branchFormRoutes');
const mediaRoutes = require('./mediaRoutes');
const newsRoutes = require('./newsRoutes');
const schoolDocumentRoutes = require('./schoolDocumentRoutes');

// Gom nhóm các route
router.use('/auth', authRoutes);             // -> /api/auth/login
router.use('/branch-admin', branchRoutes);   // -> /api/branch-admin/dashboard-stats
router.use('/branch-members', branchMemberRoutes);  // -> /api/branch-members/
router.use('/activities', activityRoutes);
router.use('/fees', branchFeeRoutes);
router.use('/branch-forms', branchFormRoutes);
router.use('/media', mediaRoutes);
router.use('/news', newsRoutes);             // -> /api/news/
router.use('/school-documents', schoolDocumentRoutes);

module.exports = router;