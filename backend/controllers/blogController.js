const { BlogPost, NewsletterSubscriber } = require('../models');
const { sendNewBlogPostEmail } = require('../services/emailService');

// Public: get all published posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await BlogPost.findAll({
      where: { isPublished: true },
      order: [['publishedAt', 'DESC']],
      attributes: ['id', 'title', 'excerpt', 'tag', 'tagColor', 'author', 'readTime', 'coverIcon', 'publishedAt'],
    });
    res.json({ success: true, posts });
  } catch (err) {
    console.error('getPosts error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

// Admin: get all posts including drafts
exports.getAllPostsAdmin = async (req, res) => {
  try {
    const posts = await BlogPost.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, posts });
  } catch (err) {
    console.error('getAllPostsAdmin error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

// Public: single post by id
exports.getPost = async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (!post.isPublished) return res.status(403).json({ success: false, message: 'Post not published' });
    res.json({ success: true, post });
  } catch (err) {
    console.error('getPost error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
};

// Admin: get single post (draft or published)
exports.getPostAdmin = async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    console.error('getPostAdmin error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
};

// Admin: create post
exports.createPost = async (req, res) => {
  try {
    const { title, excerpt, content, tag, tagColor, author, readTime, coverIcon } = req.body;
    if (!title || !excerpt || !content) {
      return res.status(400).json({ success: false, message: 'Title, excerpt, and content are required' });
    }
    const post = await BlogPost.create({
      title, excerpt, content,
      tag: tag || 'General',
      tagColor: tagColor || '#F68B3C',
      author: author || 'SkillSphere Team',
      readTime: readTime || '3 min read',
      coverIcon: coverIcon || 'newspaper-outline',
      isPublished: false,
    });
    res.status(201).json({ success: true, post });
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

// Admin: update post
exports.updatePost = async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const { title, excerpt, content, tag, tagColor, author, readTime, coverIcon } = req.body;
    await post.update({ title, excerpt, content, tag, tagColor, author, readTime, coverIcon });
    res.json({ success: true, post });
  } catch (err) {
    console.error('updatePost error:', err);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
};

// Admin: toggle publish/unpublish — emails subscribers when publishing
exports.togglePublish = async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const wasPublished = post.isPublished;
    const newState = !wasPublished;
    await post.update({
      isPublished: newState,
      publishedAt: newState ? new Date() : null,
    });

    // Send newsletter emails when newly publishing (not when unpublishing)
    if (newState) {
      try {
        const subscribers = await NewsletterSubscriber.findAll({ attributes: ['email'] });
        const emailPromises = subscribers.map(s =>
          sendNewBlogPostEmail(s.email, post).catch(e =>
            console.error(`Newsletter email failed for ${s.email}:`, e.message)
          )
        );
        await Promise.allSettled(emailPromises);
        console.log(`Newsletter sent to ${subscribers.length} subscribers for post: ${post.title}`);
      } catch (emailErr) {
        console.error('Newsletter batch error:', emailErr.message);
      }
    }

    res.json({ success: true, post });
  } catch (err) {
    console.error('togglePublish error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle publish' });
  }
};

// Admin: delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    await post.destroy();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    console.error('deletePost error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

// Public: subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }
    const [, created] = await NewsletterSubscriber.findOrCreate({
      where: { email: email.toLowerCase().trim() },
    });
    res.json({ success: true, message: created ? 'Subscribed!' : 'Already subscribed' });
  } catch (err) {
    console.error('subscribe error:', err);
    res.status(500).json({ success: false, message: 'Failed to subscribe' });
  }
};
