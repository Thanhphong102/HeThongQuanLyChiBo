const express = require('express');
const router = express.Router();
const landingController = require('../controllers/landingController');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Router cho Sơ đồ tổ chức
router.get('/org-chart', verifyToken, isSuperAdmin, landingController.getOrgChart);
router.post('/org-chart', verifyToken, isSuperAdmin, upload.single('file'), landingController.createOrgMember);
router.delete('/org-chart/:id', verifyToken, isSuperAdmin, landingController.deleteOrgMember);

// Router cho Quy trình Đảng
router.get('/process', verifyToken, isSuperAdmin, landingController.getProcesses);
router.post('/process', verifyToken, isSuperAdmin, upload.single('file'), landingController.createProcess);
router.delete('/process/:id', verifyToken, isSuperAdmin, landingController.deleteProcess);

module.exports = router;
