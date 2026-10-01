const express = require('express');
const {
  enroll,
  getMyEnrollments,
  getEnrollment,
  completeLesson,
} = require('../controllers/enrollmentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All enrollment routes require login. No admin bypass: everyone only sees their own data.
router.use(authMiddleware);

// '/me' must be declared before '/:id'
router.get('/me', getMyEnrollments);
router.get('/:id', getEnrollment);
router.post('/:id/lessons/:lessonId/complete', completeLesson);
router.post('/:courseId', enroll);

module.exports = router;
