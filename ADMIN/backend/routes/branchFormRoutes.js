const express = require('express');
const router  = express.Router();
const controller = require('../controllers/branchFormController');
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Base URL: /api/branch-forms

// ─── PUBLIC Routes (User side — chỉ cần đăng nhập) ──────────────────────────
// Lấy toàn bộ thư mục gốc của 1 chi bộ (public cho User xem)
router.get('/public/:branchId/folders',             verifyToken, controller.getPublicFolderTree);
// Lấy nội dung (subfolders + files) trong 1 thư mục
router.get('/public/folder/:folderId/contents',     verifyToken, controller.getPublicFilesInFolder);

// ─── FOLDER Routes (Admin quản lý) ─────────────────────────────────────────
// Lấy thư mục con theo parent_id (query param) — root nếu không có parent_id
router.get('/folders',                              verifyToken, controller.getFolders);
// Thông tin 1 thư mục
router.get('/folders/:id/info',                     verifyToken, controller.getFolderInfo);
// Breadcrumb của 1 thư mục
router.get('/folders/:id/breadcrumb',               verifyToken, controller.getFolderBreadcrumb);
// Lấy file trong thư mục
router.get('/folders/:id/files',                    verifyToken, controller.getFilesInFolder);

// Tạo / Sửa / Xóa thư mục (Admin only)
router.post('/folders',                             verifyToken, isBranchAdmin, controller.createFolder);
router.put('/folders/:id',                          verifyToken, isBranchAdmin, controller.updateFolder);
router.delete('/folders/:id',                       verifyToken, isBranchAdmin, controller.deleteFolder);

// Upload nhiều file vào thư mục (Admin only)
router.post('/folders/:id/upload',                  verifyToken, isBranchAdmin, upload.array('files', 20), controller.uploadFilesToFolder);

// ─── FILE Routes (giữ nguyên) ─────────────────────────────────────────────────
router.get('/',         verifyToken, controller.getForms);
router.post('/',        verifyToken, isBranchAdmin, upload.single('file'), controller.uploadForm);
router.delete('/:id',   verifyToken, isBranchAdmin, controller.deleteForm);

module.exports = router;