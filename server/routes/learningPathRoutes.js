const express = require('express');
const c = require('../controllers/learningPathController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Every learning-path route requires login. No admin bypass: users only touch their own paths.
router.use(authMiddleware);

router.post('/', c.createLearningPath);
router.get('/', c.getMyLearningPaths);
router.get('/:id', c.getLearningPath);
router.put('/:id', c.updateLearningPath);
router.delete('/:id', c.deleteLearningPath);

router.post('/:id/courses', c.addCourse);
router.delete('/:id/courses/:courseId', c.removeCourse);

router.post('/:id/custom-items', c.addCustomItem);
router.put('/:id/custom-items/:itemId', c.updateCustomItem);
router.delete('/:id/custom-items/:itemId', c.deleteCustomItem);
router.post('/:id/custom-items/:itemId/complete', c.completeCustomItem);
router.post('/:id/custom-items/:itemId/uncomplete', c.uncompleteCustomItem);

module.exports = router;