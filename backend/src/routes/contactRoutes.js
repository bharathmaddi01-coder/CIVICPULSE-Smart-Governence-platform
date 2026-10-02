// src/routes/contactRoutes.js
// Contact message routes — mounted at /api/contact in app.js.

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  submitContactMessage,
  listContactMessages,
} from '../controllers/contactController.js';

const router = express.Router();

// POST /api/contact — Public: submit inquiry/contact message
router.post('/', submitContactMessage);

// GET /api/contact — Admin: list submitted messages
router.get('/', protect, authorize('ADMIN'), listContactMessages);

export default router;
