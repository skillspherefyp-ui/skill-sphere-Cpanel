const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Create instructor (admin only)
router.post('/', requireAdmin, instructorController.createInstructor);

// Get all instructors (admin only)
router.get('/', requireAdmin, instructorController.getAllInstructors);

// Get instructor by ID (admin only)
router.get('/:id', requireAdmin, instructorController.getInstructorById);

// Update instructor (admin only)
router.put('/:id', requireAdmin, instructorController.updateInstructor);

// Toggle instructor active status (admin only)
router.patch('/:id/toggle-status', requireAdmin, instructorController.toggleInstructorStatus);

<<<<<<< HEAD
// Update instructor permissions (admin only) — POST used for cPanel proxy compatibility
router.post('/:id/permissions', requireAdmin, instructorController.updateInstructorPermissions);
=======
// Update instructor permissions (admin only)
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
router.patch('/:id/permissions', requireAdmin, instructorController.updateInstructorPermissions);

// Delete instructor (admin only) - Kept for backward compatibility but not used in UI
router.delete('/:id', requireAdmin, instructorController.deleteInstructor);

module.exports = router;



