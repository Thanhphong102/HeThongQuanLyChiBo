const express = require('express');
const router = express.Router();
const controller = require('../controllers/branchMemberController');
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, isBranchAdmin, controller.getBranchMembers);
router.post('/', verifyToken, isBranchAdmin, controller.createMember);
router.put('/:id', verifyToken, isBranchAdmin, controller.updateMember);

// API Mới:
router.put('/:id/status', verifyToken, isBranchAdmin, controller.toggleStatus); // Khóa/Mở
router.put('/:id/password', verifyToken, isBranchAdmin, controller.resetPassword); // Cấp lại pass
router.put('/:id/grant-account', verifyToken, isBranchAdmin, controller.grantAccount); // Cấp TK (MỚI)

module.exports = router;