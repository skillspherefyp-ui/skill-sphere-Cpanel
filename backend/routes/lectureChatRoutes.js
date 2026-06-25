const express = require('express');
const router = express.Router();
const lectureChatController = require('../controllers/lectureChatController');
const { authenticateToken } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(authenticateToken);
router.use(aiLimiter);

router.get('/:courseId/:topicId', lectureChatController.getHistory);
router.post('/:courseId/:topicId/messages', lectureChatController.sendMessage);
router.delete('/:courseId/:topicId', lectureChatController.clearHistory);

module.exports = router;
