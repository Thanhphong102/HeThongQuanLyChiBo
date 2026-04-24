const express = require('express');
const router = express.Router();
const controller = require('../controllers/mediaController');
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const { getFileStreamFromDrive } = require('../services/driveService'); // Import stream service

// Base: /api/media

// 1. GET: Lấy danh sách Media (Cho phép tất cả Đảng viên xem ảnh)
router.get('/', verifyToken, controller.getMedia);

// 2. Các quyền sửa đổi: Giữ nguyên isBranchAdmin
router.post('/', verifyToken, isBranchAdmin, upload.single('file'), controller.createMedia);
router.delete('/:id', verifyToken, isBranchAdmin, controller.deleteMedia);
router.put('/:id', verifyToken, isBranchAdmin, controller.updateMedia);

// 3. PROXY ẢNH TỪ GOOGLE DRIVE (Public access hoặc chặn CORS tuỳ ý)
router.get('/proxy/:fileId', async (req, res) => {
  try {
     const streamResponse = await getFileStreamFromDrive(req.params.fileId);
     res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
     res.setHeader('Content-Type', streamResponse.headers['content-type'] || 'image/jpeg');
     streamResponse.data.pipe(res);
  } catch(e) { 
     console.error('[Proxy Drive Image Error]', e.message);
     res.status(404).send('Not found'); 
  }
});

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