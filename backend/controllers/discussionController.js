const { DiscussionPost, User } = require('../models');
const { detectProfanity } = require('../utils/profanityFilter');
const { moderateContent } = require('../services/openaiService');
const { sendAccountSuspensionEmail } = require('../services/emailService');

exports.getPosts = async (req, res) => {
  try {
    const posts = await DiscussionPost.findAll({
      where: { parentId: null },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'role', 'profilePicture'] },
        {
          model: DiscussionPost,
          as: 'replies',
          include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role', 'profilePicture'] }],
          separate: true,
          order: [['createdAt', 'ASC']],
        },
      ],
      order: [['isPinned', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json({ success: true, posts });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { content, parentId } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    // Layer 1: fast keyword filter
    const matched = detectProfanity(content);
    // Layer 2: OpenAI Moderation API (free, context-aware)
    let moderationReason = matched ? `Banned word: "${matched}"` : null;
    if (!matched) {
      try {
        const mod = await moderateContent(content);
        if (mod.flagged) moderationReason = mod.reason;
      } catch (err) {
        console.error('Moderation API error (skipping):', err.message);
      }
    }

    if (moderationReason) {
      await User.update({ isActive: false }, { where: { id: req.user.id } });
      console.warn(`🚫 User ${req.user.id} suspended — ${moderationReason}`);
      sendAccountSuspensionEmail(
        req.user.email,
        req.user.name,
        `Inappropriate content detected in a community forum post (${moderationReason}).`
      ).catch(err => console.error('Suspension email failed:', err.message));
      return res.status(403).json({
        error: 'Your message contains inappropriate content. Your account has been suspended.',
        blocked: true,
      });
    }

    const post = await DiscussionPost.create({
      courseId: null,
      userId: req.user.id,
      content,
      parentId: parentId || null,
    });
    const full = await DiscussionPost.findByPk(post.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role', 'profilePicture'] }],
    });
    res.status(201).json({ success: true, post: full });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await DiscussionPost.findByPk(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId !== req.user.id && !['instructor', 'admin', 'superadmin', 'superinstructor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { content } = req.body;
    if (content) post.content = content;
    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await DiscussionPost.findByPk(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId !== req.user.id && !['instructor', 'admin', 'superadmin', 'superinstructor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await post.destroy();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.pinPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await DiscussionPost.findByPk(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.isPinned = !post.isPinned;
    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    console.error('Pin post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
