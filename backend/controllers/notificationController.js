const { Notification } = require('../models');

// SSE client map: userId -> array of res objects
const sseClients = new Map();

function pushToUser(userId, eventData) {
  const clients = sseClients.get(String(userId)) || [];
  const msg = `data: ${JSON.stringify(eventData)}\n\n`;
  clients.forEach(res => {
    try { res.write(msg); } catch (e) { /* ignore */ }
  });
}

exports.sseClients = sseClients;
exports.pushToUser = pushToUser;

exports.streamNotifications = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const userId = String(req.user.id);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(': heartbeat\n\n');

  if (!sseClients.has(userId)) sseClients.set(userId, []);
  sseClients.get(userId).push(res);

  try {
    const unread = await Notification.findAll({
      where: { userId: req.user.id, isRead: false },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    if (unread.length > 0) {
      res.write(`data: ${JSON.stringify({ type: 'init', notifications: unread })}\n\n`);
    }
  } catch (e) { /* ignore */ }

  const hb = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch (e) { clearInterval(hb); }
  }, 30000);

  req.on('close', () => {
    clearInterval(hb);
    const list = sseClients.get(userId) || [];
    const idx = list.indexOf(res);
    if (idx !== -1) list.splice(idx, 1);
    if (list.length === 0) sseClients.delete(userId);
  });
};

exports.deleteMultipleNotifications = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array required' });
    await Notification.destroy({ where: { id: ids, userId: req.user.id } });
    res.json({ success: true, message: 'Notifications deleted' });
  } catch (err) {
    console.error('Delete multiple notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all notifications for authenticated user
exports.getMyNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const where = { userId: req.user.id };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      notifications,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Get my notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.destroy();

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Clear all notifications
exports.clearAllNotifications = async (req, res) => {
  try {
    await Notification.destroy({
      where: { userId: req.user.id }
    });

    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = exports;
