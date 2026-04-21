const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticateToken, requireInstructor, canManageCertificates } = require('../middleware/auth');

// Get student's certificates (requires authentication)
router.get('/my', authenticateToken, certificateController.getMyCertificates);

// Instructor/admin certificate management routes
router.get('/all', authenticateToken, requireInstructor, canManageCertificates, certificateController.getAllCertificates);

// Generate certificate (requires authentication)
router.post('/', authenticateToken, certificateController.generateCertificate);

// Verify certificate (public route)
router.get('/verify/:certificateNumber', certificateController.verifyCertificate);

// Instructor/admin certificate detail routes
router.get('/:id', authenticateToken, requireInstructor, canManageCertificates, certificateController.getCertificateById);
router.delete('/:id', authenticateToken, requireInstructor, canManageCertificates, certificateController.deleteCertificate);

module.exports = router;
