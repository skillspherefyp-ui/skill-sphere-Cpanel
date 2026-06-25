const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// SSE stream — token via query param (EventSource can't set headers)
router.get('/stream', (req, res, next) => {
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}, notificationController.streamNotifications);

// All other notification routes require authentication
router.use(authenticateToken);

// Delete multiple notifications
router.delete('/bulk', notificationController.deleteMultipleNotifications);

// Get user's notifications
router.get('/my', notificationController.getMyNotifications);

// Mark notification as read
router.put('/read/:id', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Clear all notifications
router.delete('/clear/all', notificationController.clearAllNotifications);
router.delete('/clear', notificationController.clearAllNotifications);

module.exports = router;
