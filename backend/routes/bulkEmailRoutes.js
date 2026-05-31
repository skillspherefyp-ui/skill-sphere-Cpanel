const express = require('express');
const router = express.Router();
const { getRecipients, sendBulk } = require('../controllers/bulkEmailController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/recipients', getRecipients);
router.post('/send', sendBulk);

module.exports = router;
