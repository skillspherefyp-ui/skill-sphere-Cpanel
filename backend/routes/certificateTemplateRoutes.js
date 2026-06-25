const express = require('express');
const router = express.Router();
const path = require('path');
const certificateTemplateController = require('../controllers/certificateTemplateController');
const { authenticateToken, requireInstructor, canManageCertificates } = require('../middleware/auth');

// Public: serve certificate logo (no auth — needed by frontend card preview)
router.get('/cert-logo', (req, res) => {
  res.sendFile(path.join(__dirname, '../assets/skillsphere-logo.png'));
});

// Student-accessible routes (auth only, no instructor required)
router.get('/active', authenticateToken, certificateTemplateController.getActiveTemplate);
router.get('/for-course/:courseId', authenticateToken, certificateTemplateController.getTemplateForCourse);
router.get('/:id/signature-image', authenticateToken, certificateTemplateController.getSignatureImage);

// All remaining routes require authentication and instructor role
router.use(authenticateToken);
router.use(requireInstructor);

// Get certificate statistics
router.get('/stats', certificateTemplateController.getCertificateStats);

// Get all templates
router.get('/', certificateTemplateController.getAllTemplates);

// Get active templates per course (shows all course-specific assignments)
router.get('/active-per-course', certificateTemplateController.getActiveTemplatesPerCourse);

// Preview certificate (with or without template ID)
router.get('/preview', certificateTemplateController.previewCertificate);
router.get('/preview/:id', certificateTemplateController.previewCertificate);

// Instructor signature — stored on the user, applies to ALL their templates
// MUST be before /:id to avoid being matched as an id param
router.get('/my-signature', certificateTemplateController.getOwnSignature);
router.post('/my-signature', certificateTemplateController.saveSignature);
router.delete('/my-signature', certificateTemplateController.clearSignature);

// Get template by ID
router.get('/:id', certificateTemplateController.getTemplateById);

// Create new template (requires certificate management permission)
router.post('/', canManageCertificates, certificateTemplateController.createTemplate);

// Update template
router.put('/:id', canManageCertificates, certificateTemplateController.updateTemplate);

// Activate template (set as global default)
router.put('/:id/activate', canManageCertificates, certificateTemplateController.activateTemplate);

// Activate template for specific courses
router.put('/:id/activate-for-courses', canManageCertificates, certificateTemplateController.activateTemplateForCourses);

// Delete template
router.delete('/:id', canManageCertificates, certificateTemplateController.deleteTemplate);

module.exports = router;
