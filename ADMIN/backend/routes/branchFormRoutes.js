const express = require('express');
const router  = express.Router();
const controller = require('../controllers/branchFormController');
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Base URL: /api/branch-forms

// ─── FOLDER Routes ─────────────────────────────────────────────────────────
// Cả admin và đảng viên đều có thể XEM thư mục/file
router.get('/folders',                   verifyToken, controller.getFolders);
router.get('/folders/:id/files',         verifyToken, controller.getFilesInFolder);

// Chỉ admin mới được tạo/sửa/xóa thư mục và upload file
router.post('/folders',                  verifyToken, isBranchAdmin, controller.createFolder);
router.put('/folders/:id',               verifyToken, isBranchAdmin, controller.updateFolder);
router.delete('/folders/:id',            verifyToken, isBranchAdmin, controller.deleteFolder);
router.post('/folders/:id/upload',       verifyToken, isBranchAdmin, upload.array('files', 20), controller.uploadFilesToFolder);

// ─── FILE Routes (giữ nguyên) ────────────────────────────────────────────────
// Lấy danh sách biểu mẫu lẻ (không thuộc folder nào)
router.get('/',   verifyToken, controller.getForms);
// Upload file lẻ
router.post('/',  verifyToken, isBranchAdmin, upload.single('file'), controller.uploadForm);
// Xóa file (cả trong folder và lẻ)
router.delete('/:id', verifyToken, isBranchAdmin, controller.deleteForm);

module.exports = router;