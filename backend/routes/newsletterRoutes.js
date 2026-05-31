const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getSubscribers, subscribe, unsubscribe } = require('../controllers/newsletterController');

router.get('/subscribers',           authenticateToken, requireAdmin, getSubscribers);
router.post('/subscribe/:userId',    authenticateToken, requireAdmin, subscribe);
router.delete('/unsubscribe/:userId', authenticateToken, requireAdmin, unsubscribe);

module.exports = router;
