// src/routes/notificationRoutes.js
// Notification routes — mounted at /api/notifications in app.js.
//
// IMPORTANT: /read-all must be defined BEFORE /:id
// so Express matches it before treating "read-all" as an ObjectId.

import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js';

const router = express.Router();

// GET  /api/notifications              — list own notifications
router.get('/', protect, getNotifications);

// GET  /api/notifications/unread-count — get unread notification count
router.get('/unread-count', protect, getUnreadCount);

// PUT  /api/notifications/read-all     — mark all own notifications as read (static, before /:id)
router.put('/read-all', protect, markAllNotificationsRead);

// PUT  /api/notifications/:id/read     — mark one notification as read
router.put('/:id/read', protect, markNotificationRead);

export default router;
