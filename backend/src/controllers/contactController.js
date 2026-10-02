// src/controllers/contactController.js
// Public contact form submission & Admin message review.
// Route → Controller → Model (no service/repository layer).

import ContactMessage from '../models/ContactMessage.js';

// Simple email regex for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ===========================================================================
// POST /api/contact
// Public — submit public inquiry/contact message.
// ===========================================================================
export const submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Subject is required.' });
    }
    if (subject.trim().length < 3) {
      return res.status(400).json({ message: 'Subject must be at least 3 characters.' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }
    if (message.trim().length < 10) {
      return res.status(400).json({ message: 'Message must be at least 10 characters.' });
    }

    const contactMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    return res.status(201).json({
      message: 'Thank you. Your message has been received by the SGP team.',
      contactMessage,
    });
  } catch (err) {
    console.error('submitContactMessage error:', err.message);
    return res.status(500).json({ message: 'Server error saving contact message.' });
  }
};

// ===========================================================================
// GET /api/contact
// ADMIN only — review submitted inquiries.
// ===========================================================================
export const listContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ messages });
  } catch (err) {
    console.error('listContactMessages error:', err.message);
    return res.status(500).json({ message: 'Server error fetching contact messages.' });
  }
};
