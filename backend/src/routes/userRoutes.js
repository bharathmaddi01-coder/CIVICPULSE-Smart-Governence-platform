// src/routes/userRoutes.js
// User profile & Admin user-management routes.
// Mounted at /api/users in app.js.

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  listUsers,
  createUser,
  getUserById,
} from '../controllers/userController.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Static routes — must come BEFORE /:id
// ---------------------------------------------------------------------------

// GET /api/users/profile — Authenticated user: get profile
router.get('/profile', protect, getProfile);

// PUT /api/users/profile — Authenticated user: update own name and email
router.put('/profile', protect, updateProfile);

// GET /api/users — Admin: list platform users & staff (?search=, ?role=)
router.get('/', protect, authorize('ADMIN'), listUsers);

// POST /api/users — Admin: create managed staff or citizen user
router.post('/', protect, authorize('ADMIN'), createUser);

// ---------------------------------------------------------------------------
// Dynamic :id routes
// ---------------------------------------------------------------------------

// GET /api/users/:id — Admin: view user detail
router.get('/:id', protect, authorize('ADMIN'), getUserById);

export default router;
