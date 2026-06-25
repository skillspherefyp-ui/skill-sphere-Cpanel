const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/posts', discussionController.getPosts);
router.post('/posts', discussionController.createPost);
router.put('/posts/:id', discussionController.updatePost);
router.delete('/posts/:id', discussionController.deletePost);
router.patch('/posts/:id/pin', discussionController.pinPost);

module.exports = router;
