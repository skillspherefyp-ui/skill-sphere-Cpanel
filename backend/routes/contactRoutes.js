const express = require('express');
const router = express.Router();
const { submitContact } = require('../controllers/contactController');

// Public — no auth required
router.post('/', submitContact);

module.exports = router;
