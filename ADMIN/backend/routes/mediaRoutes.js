const express = require('express');
const router = express.Router();
const controller = require('../controllers/mediaController');
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Base: /api/media

// 1. GET: Cho phép tất cả Đảng viên xem ảnh
router.get('/', verifyToken, controller.getMedia);

// 2. Các quyền sửa đổi: Giữ nguyên isBranchAdmin
router.post('/', verifyToken, isBranchAdmin, upload.single('file'), controller.createMedia);
router.delete('/:id', verifyToken, isBranchAdmin, controller.deleteMedia);
router.put('/:id', verifyToken, isBranchAdmin, controller.updateMedia);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const controller = require('../controllers/mediaController');
// const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');
// const multer = require('multer');
// const upload = multer({ storage: multer.memoryStorage() });

// // Base: /api/media

// router.get('/', verifyToken, isBranchAdmin, controller.getMedia);
// router.post('/', verifyToken, isBranchAdmin, upload.single('file'), controller.createMedia);
// router.delete('/:id', verifyToken, isBranchAdmin, controller.deleteMedia);
// router.put('/:id', verifyToken, isBranchAdmin, controller.updateMedia);

// module.exports = router;