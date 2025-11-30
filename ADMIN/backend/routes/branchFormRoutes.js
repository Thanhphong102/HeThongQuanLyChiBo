const express = require('express');
const router = express.Router();
const controller = require('../controllers/branchFormController');
// Giữ verifyToken, BỎ isBranchAdmin ở dòng GET
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Base URL: /api/branch-forms

// 1. GET: Cho phép cả Admin và Đảng viên xem danh sách biểu mẫu
router.get('/', verifyToken, controller.getForms); 

// 2. POST/DELETE: Vẫn giữ isBranchAdmin (Chỉ Admin mới được đăng/xóa)
router.post('/', verifyToken, isBranchAdmin, upload.single('file'), controller.uploadForm);
router.delete('/:id', verifyToken, isBranchAdmin, controller.deleteForm);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const controller = require('../controllers/branchFormController');
// const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');
// const multer = require('multer');
// const upload = multer({ storage: multer.memoryStorage() });

// // Base URL: /api/branch-forms (Sẽ khai báo ở index.js)

// router.get('/', verifyToken, isBranchAdmin, controller.getForms);
// router.post('/', verifyToken, isBranchAdmin, upload.single('file'), controller.uploadForm);
// router.delete('/:id', verifyToken, isBranchAdmin, controller.deleteForm);

// module.exports = router;