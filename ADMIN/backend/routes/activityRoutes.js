const express = require('express');
const router = express.Router();
const controller = require('../controllers/activityController');
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Đường dẫn gốc: /api/activities

// 1. GET: Cho phép Đảng viên xem danh sách lịch họp
router.get('/', verifyToken, controller.getActivities); 
router.get('/my-attendance', verifyToken, controller.getMyAttendance);
router.put('/:id', verifyToken, isBranchAdmin, controller.updateActivity); // [MỚI] Sửa
router.delete('/:id', verifyToken, isBranchAdmin, controller.deleteActivity); // [MỚI] Xóa

// 2. Các chức năng quản lý: Giữ nguyên isBranchAdmin
router.post('/', verifyToken, isBranchAdmin, controller.createActivity); 
router.get('/:id/attendance', verifyToken, isBranchAdmin, controller.getAttendanceList); 
router.post('/:id/attendance', verifyToken, isBranchAdmin, controller.saveAttendance); 
router.post('/:id/upload', verifyToken, isBranchAdmin, upload.single('file'), controller.uploadMinutes); 

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const controller = require('../controllers/activityController');
// const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');
// const multer = require('multer');
// const upload = multer({ storage: multer.memoryStorage() });

// // Đường dẫn gốc: /api/activities

// router.get('/', verifyToken, isBranchAdmin, controller.getActivities); // Lấy danh sách họp
// router.post('/', verifyToken, isBranchAdmin, controller.createActivity); // Tạo lịch họp
// router.get('/:id/attendance', verifyToken, isBranchAdmin, controller.getAttendanceList); // Lấy ds điểm danh
// router.post('/:id/attendance', verifyToken, isBranchAdmin, controller.saveAttendance); // Lưu điểm danh
// router.post('/:id/upload', verifyToken, isBranchAdmin, upload.single('file'), controller.uploadMinutes); // Upload biên bản

// module.exports = router;