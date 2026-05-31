const { NewsletterSubscriber, User } = require('../models');

// GET /api/newsletter/subscribers — returns subscriber emails
exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.findAll({
      attributes: ['id', 'email'],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, subscribers });
  } catch (err) {
    console.error('Get subscribers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/newsletter/subscribe/:userId — add registered user's email
exports.subscribe = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, { attributes: ['id', 'name', 'email'] });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [, created] = await NewsletterSubscriber.findOrCreate({
      where: { email: user.email.toLowerCase().trim() },
    });

    res.json({
      success: true,
      message: created ? `${user.name} added to newsletter` : `${user.name} is already subscribed`,
    });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/newsletter/unsubscribe/:userId — remove registered user's email
exports.unsubscribe = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, { attributes: ['id', 'name', 'email'] });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await NewsletterSubscriber.destroy({
      where: { email: user.email.toLowerCase().trim() },
    });

    res.json({ success: true, message: `${user.name} removed from newsletter` });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
