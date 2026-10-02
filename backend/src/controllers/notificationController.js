// src/controllers/notificationController.js
// In-app notification management.
// Users can only read and manage their own notifications.
//
// Endpoints:
//   GET  /api/notifications          — list own notifications (newest first)
//   PUT  /api/notifications/:id/read — mark one notification as read
//   PUT  /api/notifications/read-all — mark all own notifications as read

import Notification from '../models/Notification.js';

// ---------------------------------------------------------------------------
// GET /api/notifications
// Protected — any authenticated user.
// Returns notifications belonging ONLY to the logged-in user (req.user.id).
// Sorted newest-first.
// ---------------------------------------------------------------------------
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('complaint', 'reference title status')
      .lean();

    return res.status(200).json({ notifications });
  } catch (err) {
    console.error('getNotifications error:', err.message);
    return res.status(500).json({ message: 'Server error fetching notifications.' });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/notifications/:id/read
// Protected — mark ONE notification as read.
// Security: user can only mark their own notifications.
// ---------------------------------------------------------------------------
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    // Ownership check — user can only update their own notification
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. This notification does not belong to you.' });
    }

    notification.read = true;
    await notification.save();

    return res.status(200).json({
      message: 'Notification marked as read.',
      notification,
    });
  } catch (err) {
    console.error('markNotificationRead error:', err.message);
    return res.status(500).json({ message: 'Server error updating notification.' });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/notifications/read-all
// Protected — mark ALL of the logged-in user's unread notifications as read.
// Specified in PROJECT_CONTEXT.md API architecture section.
// ---------------------------------------------------------------------------
export const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      message: 'All notifications marked as read.',
      updated: result.modifiedCount,
    });
  } catch (err) {
    console.error('markAllNotificationsRead error:', err.message);
    return res.status(500).json({ message: 'Server error updating notifications.' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/notifications/unread-count
// Protected — count of unread notifications for the logged-in user.
// ---------------------------------------------------------------------------
export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      read: false,
    });

    return res.status(200).json({ unreadCount });
  } catch (err) {
    console.error('getUnreadCount error:', err.message);
    return res.status(500).json({ message: 'Server error counting unread notifications.' });
  }
};

