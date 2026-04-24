const express = require('express');
const router = express.Router();

const authRoutes              = require('./authRoutes');
const branchRoutes            = require('./branchRoutes');
const branchMemberRoutes      = require('./branchMemberRoutes');
const activityRoutes          = require('./activityRoutes');
const branchFeeRoutes         = require('./branchFeeRoutes');
const branchFormRoutes        = require('./branchFormRoutes');
const mediaRoutes             = require('./mediaRoutes');
const newsRoutes              = require('./newsRoutes');
const schoolDocumentRoutes    = require('./schoolDocumentRoutes');
const hybridAttendanceRoutes  = require('./hybridAttendanceRoutes');  // Task 7: QR Attendance
const activityEventsRoutes    = require('./activityEventsRoutes');    // Task 8: Quản lý Hoạt động
const notificationRoutes      = require('./notificationRoutes');      // [NEW] Task 2: Notification
const publicRoutes            = require('./publicRoutes');            // [NEW] Task 5: Landing Data (Public)
const targetRoutes            = require('./targetRoutes');            // [NEW] Task 9: Nhận chỉ tiêu

// Gom nhóm các route
router.use('/auth',              authRoutes);
router.use('/branch-admin',      branchRoutes);
router.use('/branch-members',    branchMemberRoutes);
router.use('/activities',        activityRoutes);
router.use('/fees',              branchFeeRoutes);
router.use('/branch-forms',      branchFormRoutes);
router.use('/media',             mediaRoutes);
router.use('/news',              newsRoutes);
router.use('/school-documents',  schoolDocumentRoutes);
router.use('/hybrid-attendance', hybridAttendanceRoutes); // Task 7
router.use('/events',            activityEventsRoutes);   // Task 8
router.use('/notifications',     notificationRoutes);     // Task 2
router.use('/public',            publicRoutes);           // Task 5 (Dữ liệu Landing)
router.use('/targets',           targetRoutes);           // Task 9


module.exports = router;