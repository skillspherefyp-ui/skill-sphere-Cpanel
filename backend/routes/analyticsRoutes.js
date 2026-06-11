const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireInstructor } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireInstructor);

router.get('/overview', analyticsController.getOverview);
router.get('/courses/:courseId/engagement', analyticsController.getEngagement);
router.get('/courses/:courseId/confusion', analyticsController.getConfusion);
router.get('/courses/:courseId/students', analyticsController.getStudents);
router.get('/courses/:courseId/timeline', analyticsController.getTimeline);

module.exports = router;
