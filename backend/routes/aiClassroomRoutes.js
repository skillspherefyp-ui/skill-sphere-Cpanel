const express = require('express');
const router = express.Router();
const { authenticateToken, requireInstructor } = require('../middleware/auth');
const controller = require('../controllers/aiClassroomController');

// ── AI Course Generator (instructor / admin only) ─────────────────────────────
// Creates real Course + Topics + triggers existing aiTutorService generation.
// Status polling uses existing GET /api/ai-tutor/courses/:courseId/generate-status
router.post('/course/generate', authenticateToken, requireInstructor, controller.startCourseGeneration);

module.exports = router;
