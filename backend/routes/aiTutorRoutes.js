const express = require('express');
const router = express.Router();
const aiTutorController = require('../controllers/aiTutorController');
const { authenticateToken } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(authenticateToken);
router.use(aiLimiter);

router.put('/topics/:topicId/outline', aiTutorController.upsertOutline);
router.post('/topics/:topicId/generate', aiTutorController.generateTopicPackage);
router.get('/topics/:topicId/generate-status', aiTutorController.getTopicGenerationStatus);
router.post('/courses/:courseId/generate', aiTutorController.generateCoursePackage);
router.get('/courses/:courseId/generate-status', aiTutorController.getGenerationStatus);
router.get('/courses/:courseId/lectures', aiTutorController.listLectures);
router.get('/topics/:topicId/package', aiTutorController.getLecturePackage);

router.post('/topics/:topicId/start', aiTutorController.startSession);
router.get('/sessions/:sessionId', aiTutorController.getSessionState);
router.post('/sessions/:sessionId/next', aiTutorController.getNextChunk);
router.post('/sessions/:sessionId/restart', aiTutorController.restartSession);
router.post('/sessions/:sessionId/pause', aiTutorController.pauseSession);
router.post('/sessions/:sessionId/resume', aiTutorController.resumeSession);
router.post('/sessions/:sessionId/questions', aiTutorController.submitQuestion);

router.get('/lectures/:lectureId/flashcards', aiTutorController.getFlashcards);
router.get('/lectures/:lectureId/quiz', aiTutorController.getQuiz);
router.post('/lectures/:lectureId/quiz/submit', aiTutorController.submitQuiz);

router.post('/audio/transcribe', aiTutorController.audioUploadMiddleware, aiTutorController.transcribeAudio);
router.post('/audio/speak', aiTutorController.speakText);
router.get('/smoke-test', aiTutorController.smokeTest);
<<<<<<< HEAD
router.post('/checkpoint/evaluate', aiTutorController.evaluateCheckpoint);
router.post('/topics/:topicId/guided-steps', aiTutorController.retriggerGuidedSteps);
=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821

// Phase 3: Student memory
router.get('/memory/:courseId', aiTutorController.getStudentMemory);
router.delete('/memory/:courseId', aiTutorController.deleteStudentMemory);

// Phase 4: Adaptive plans
router.post('/topics/:topicId/adaptive', aiTutorController.generateAdaptivePlan);
router.get('/topics/:topicId/adaptive', aiTutorController.getAdaptivePlan);
router.patch('/adaptive/:planId/complete', aiTutorController.completeAdaptivePlan);

module.exports = router;
