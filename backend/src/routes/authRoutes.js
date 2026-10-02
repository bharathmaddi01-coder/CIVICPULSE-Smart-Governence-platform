// src/routes/authRoutes.js
// Authentication routes.
// Mounted at /api/auth in app.js.

import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register — create a new CITIZEN account
router.post('/register', register);

// POST /api/auth/login — verify credentials and return a JWT
router.post('/login', login);

// GET /api/auth/me — returns currently authenticated user
router.get('/me', protect, getMe);

export default router;
