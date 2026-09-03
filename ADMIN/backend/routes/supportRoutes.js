const express = require('express');
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/supportController');

const router = express.Router();
router.use(auth.verifyToken);
router.get('/contact', ctrl.getContact);
router.put('/contact', ctrl.updateContact);
router.get('/feedback', ctrl.listFeedback);
router.post('/feedback', ctrl.createFeedback);
router.get('/feedback/:id', ctrl.getFeedback);
router.post('/feedback/:id/replies', ctrl.reply);
router.put('/feedback/:id/status', ctrl.updateFeedbackStatus);
module.exports = router;
