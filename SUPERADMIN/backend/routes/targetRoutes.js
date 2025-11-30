const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, isSuperAdmin, targetController.getTargets);
router.post('/', verifyToken, isSuperAdmin, targetController.createTarget);
router.delete('/:id', verifyToken, isSuperAdmin, targetController.deleteTarget);

module.exports = router;