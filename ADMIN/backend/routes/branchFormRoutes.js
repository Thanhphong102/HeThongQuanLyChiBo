const express = require('express');
const router  = express.Router();
const controller = require('../controllers/branchFormController');
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 20, fileSize: 50 * 1024 * 1024 }
});

const uploadFolderFiles = (req, res, next) => {
  upload.array('files', 20)(req, res, (error) => {
    if (!error) return next();

    const isMultipartError = error instanceof multer.MulterError ||
      /multipart|boundary/i.test(error.message || '');
    console.error('[branch-forms upload middleware]:', error.message);
    return res.status(isMultipartError ? 400 : 500).json({
      message: isMultipartError
        ? 'Dữ liệu tải lên không hợp lệ. Vui lòng chọn lại file và thử lại.'
        : 'Không thể xử lý dữ liệu tải lên'
    });
  });
};

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
router.post('/folders/:id/upload',                  verifyToken, isBranchAdmin, uploadFolderFiles, controller.uploadFilesToFolder);

// ─── FILE Routes (giữ nguyên) ─────────────────────────────────────────────────
router.get('/',         verifyToken, controller.getForms);
router.post('/',        verifyToken, isBranchAdmin, upload.single('file'), controller.uploadForm);
router.delete('/:id',   verifyToken, isBranchAdmin, controller.deleteForm);

module.exports = router;
