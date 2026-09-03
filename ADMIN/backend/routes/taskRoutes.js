const express = require('express');
const multer = require('multer');
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/taskController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf|application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/;
    cb(allowed.test(file.mimetype) ? null : new Error('Định dạng file không được hỗ trợ'), allowed.test(file.mimetype));
  }
});

router.use(auth.verifyToken);
router.get('/mine', ctrl.listMine);
router.get('/mine/:id', ctrl.getMine);
router.post('/recipients/:recipientId/submit', (req,res,next) => upload.array('files',5)(req,res,error => error ? res.status(400).json({ message: error.message }) : next()), ctrl.submit);
router.get('/', ctrl.listAdmin);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getAdminDetail);
router.put('/:id', ctrl.update);
router.put('/:id/status', ctrl.updateStatus);
router.delete('/:id', ctrl.remove);
router.post('/:id/remind', ctrl.remind);
router.put('/recipients/:recipientId/review', ctrl.review);

module.exports = router;
