const express = require('express');
const router = express.Router();
const certificateTemplateController = require('../controllers/certificateTemplateController');
const { authenticateToken, requireInstructor, canManageCertificates } = require('../middleware/auth');

// Student-accessible routes (auth only, no instructor required)
router.get('/active', authenticateToken, certificateTemplateController.getActiveTemplate);
router.get('/for-course/:courseId', authenticateToken, certificateTemplateController.getTemplateForCourse);

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

// Upload background image
router.post('/:id/upload/background', canManageCertificates, certificateTemplateController.uploadBackground);

// Upload instructor signature
router.post('/:id/upload/signature', canManageCertificates, certificateTemplateController.uploadInstructorSignature);

module.exports = router;
