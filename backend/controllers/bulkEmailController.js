const { User, Notification } = require('../models');
const { sendBulkCustomEmail } = require('../services/emailService');

// GET /api/bulk-email/recipients
exports.getRecipients = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'email', 'role', 'profilePicture'],
      order: [['name', 'ASC']],
    });

    const students    = users.filter(u => u.role === 'student');
    const instructors = users.filter(u => u.role === 'instructor');
    const experts     = users.filter(u => u.role === 'expert');

    res.json({ success: true, students, instructors, experts });
  } catch (err) {
    console.error('Get recipients error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/bulk-email/send
// Body: { userIds: [1,2,3], subject: '...', message: '...', isAnnouncement: true|false }
exports.sendBulk = async (req, res) => {
  try {
    const { userIds, subject, message, isAnnouncement = false } = req.body;

    if (!userIds?.length)  return res.status(400).json({ error: 'No recipients selected' });
    if (!subject?.trim())  return res.status(400).json({ error: 'Subject is required' });
    if (!message?.trim())  return res.status(400).json({ error: 'Message is required' });
    if (userIds.length > 200) return res.status(400).json({ error: 'Max 200 recipients per send' });

    const users = await User.findAll({
      where: { id: userIds, isActive: true },
      attributes: ['id', 'name', 'email'],
    });

    if (!users.length) return res.status(400).json({ error: 'No valid recipients found' });

    const results = { sent: 0, failed: 0, errors: [] };

    // Send emails sequentially to avoid SMTP rate limits
    for (const user of users) {
      try {
        await sendBulkCustomEmail(user.email, user.name, subject.trim(), message.trim());
        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push({ userId: user.id, email: user.email, error: err.message });
        console.error(`Bulk email failed for ${user.email}:`, err.message);
      }
    }

    // Create in-app notifications for all valid recipients if isAnnouncement is checked
    if (isAnnouncement && users.length > 0) {
      try {
        await Notification.bulkCreate(
          users.map(user => ({
            userId: user.id,
            title: subject.trim(),
            message: message.trim(),
            type: 'info',
            isRead: false,
          }))
        );
      } catch (err) {
        console.error('Bulk notification create error:', err.message);
      }
    }

    res.json({
      success: true,
      message: `Sent ${results.sent} email(s)${results.failed ? `, ${results.failed} failed` : ''}${isAnnouncement ? ' + notification posted' : ''}`,
      results,
    });
  } catch (err) {
    console.error('Bulk send error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
