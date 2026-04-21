const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Admin-only routes (must be before /:id wildcard)
router.get('/admin/all', authenticateToken, requireAdmin, blogController.getAllPostsAdmin);
router.get('/admin/:id', authenticateToken, requireAdmin, blogController.getPostAdmin);
router.post('/', authenticateToken, requireAdmin, blogController.createPost);
router.put('/:id', authenticateToken, requireAdmin, blogController.updatePost);
router.patch('/:id/publish', authenticateToken, requireAdmin, blogController.togglePublish);
router.delete('/:id', authenticateToken, requireAdmin, blogController.deletePost);

// Public
router.get('/', blogController.getPosts);
router.post('/subscribe', blogController.subscribe);
router.get('/:id', blogController.getPost);

module.exports = router;
