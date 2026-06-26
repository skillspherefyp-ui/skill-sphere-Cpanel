const express = require('express');
const router  = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

// Create Safepay payment session — returns checkoutUrl + tracker
router.post('/create-order', authenticateToken, paymentController.createOrder);

// Verify payment after user returns from Safepay — issues certificate on success
router.post('/verify', authenticateToken, paymentController.verifyPayment);

// Safepay webhook — register this URL in your Safepay dashboard
// URL: https://yourdomain.com/api/payments/webhook
router.post('/webhook', paymentController.webhook);

module.exports = router;
