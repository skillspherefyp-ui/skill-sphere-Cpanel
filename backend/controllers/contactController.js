const { sendContactEmail } = require('../services/emailService');

exports.submitContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email and message are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (message.trim().length > 2000) {
      return res.status(400).json({ error: 'Message is too long (max 2000 characters)' });
    }

    await sendContactEmail(name.trim(), email.trim(), message.trim());
    res.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
};
