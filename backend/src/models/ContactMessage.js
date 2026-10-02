// src/models/ContactMessage.js
// Messages submitted via the public Contact page.
// No authentication required to submit. No replies are sent via this model.
// Admin can view submitted messages later through the admin panel if implemented.

import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  subject: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
  },

  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('ContactMessage', contactMessageSchema);
