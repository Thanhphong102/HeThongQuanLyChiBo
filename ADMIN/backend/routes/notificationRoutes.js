const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.verifyToken, notificationController.getNotifications);
router.put('/read-all', authMiddleware.verifyToken, notificationController.markAllAsRead);
router.put('/:id/read', authMiddleware.verifyToken, notificationController.markAsRead);
router.put('/:id/unread', authMiddleware.verifyToken, notificationController.markAsUnread);
router.delete('/all', authMiddleware.verifyToken, notificationController.deleteAllNotifications);
router.delete('/:id', authMiddleware.verifyToken, notificationController.deleteNotification);

module.exports = router;
