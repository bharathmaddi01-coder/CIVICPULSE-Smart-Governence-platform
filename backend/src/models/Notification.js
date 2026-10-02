// src/models/Notification.js
// In-app notifications sent to citizens, staff, and admins.
// Created inside complaintController whenever a significant complaint event occurs.
// The read flag is false by default and set to true when the user views the notification.

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },

  // The user this notification belongs to.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,  // most queries filter by user — index is required
  },

  // The complaint this notification relates to. Null for system-level messages.
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    default: null,
  },

  // Whether the user has seen this notification.
  read: {
    type: Boolean,
    required: true,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,  // used to sort notifications newest-first
  },
});

export default mongoose.model('Notification', notificationSchema);
