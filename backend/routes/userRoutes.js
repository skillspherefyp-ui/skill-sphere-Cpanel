const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireInstructor, requireAdmin } = require('../middleware/auth');

// All routes require authentication and instructor role
router.use(authenticateToken);
router.use(requireInstructor);

// Bulk operations
router.post('/bulk-action', requireAdmin, userController.bulkAction);
router.get('/export/csv', userController.exportUsersCSV);

// Get all students
router.get('/students', userController.getAllStudents);

// Get all experts
router.get('/experts', userController.getAllExperts);

// User stats
router.get('/stats', userController.getUserStats);
router.get('/stats/:id', userController.getUserStats);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Toggle user active status
router.patch('/:id/toggle-status', userController.toggleUserStatus);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
