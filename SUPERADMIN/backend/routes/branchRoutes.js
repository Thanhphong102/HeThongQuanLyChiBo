const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');

// Các route bắt đầu bằng /api/branches
router.get('/', verifyToken, isSuperAdmin, branchController.getBranches);
router.post('/', verifyToken, isSuperAdmin, branchController.createBranch);
router.put('/:id', verifyToken, isSuperAdmin, branchController.updateBranch);
router.put('/:id/archive', verifyToken, isSuperAdmin, branchController.archiveBranch);

module.exports = router;