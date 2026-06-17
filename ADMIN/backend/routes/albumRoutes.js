const express = require('express');
const router = express.Router();
const controller = require('../controllers/albumController');
const { verifyToken, isBranchAdmin } = require('../middleware/authMiddleware');

// Base: /api/albums

router.get('/', verifyToken, controller.getAlbums);
router.get('/:id', verifyToken, controller.getAlbumById);

router.post('/', verifyToken, isBranchAdmin, controller.createAlbum);
router.put('/:id', verifyToken, isBranchAdmin, controller.updateAlbum);
router.delete('/:id', verifyToken, isBranchAdmin, controller.deleteAlbum);

module.exports = router;
