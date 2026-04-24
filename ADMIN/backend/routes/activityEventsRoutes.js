const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/activityEventsController');
const auth    = require('../middleware/authMiddleware');
const multer  = require('multer');
const upload  = multer({ storage: multer.memoryStorage() });

router.use(auth.verifyToken);

// CRUD Hoạt động
router.get('/',              ctrl.getActivities);      // GET /api/events
router.post('/',             ctrl.createActivity);     // POST /api/events
router.put('/:id',           ctrl.updateActivity);     // PUT /api/events/:id
router.delete('/:id',        ctrl.deleteActivity);     // DELETE /api/events/:id

// Quản lý đăng ký tham gia (Dành cho CÁN BỘ)
router.get('/:id/registrations',             ctrl.getRegistrations);     // GET /api/events/:id/registrations
router.post('/registrations/:regId/confirm', ctrl.confirmRegistration);  // POST /api/events/registrations/:regId/confirm
router.post('/registrations/:regId/reject',  ctrl.rejectRegistration);   // POST /api/events/registrations/:regId/reject

// ===========================================
// ROUTE MỚI - Dành cho ĐẢNG VIÊN (USER)
// ===========================================
router.get('/user-list', ctrl.getUserEvents);
router.post('/:id/register', ctrl.registerEvent);
router.post('/registrations/:regId/evidence', upload.single('file'), ctrl.uploadEvidence);

module.exports = router;
