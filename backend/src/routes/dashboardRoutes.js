// src/routes/dashboardRoutes.js
// Dashboard routes — mounted at /api/dashboard in app.js.

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getCitizenDashboard,
  getStaffDashboard,
  getAdminDashboard,
} from '../controllers/dashboardController.js';

const router = express.Router();

// GET /api/dashboard/citizen — Citizen personal dashboard
router.get('/citizen', protect, authorize('CITIZEN'), getCitizenDashboard);

// GET /api/dashboard/staff — Staff workload dashboard
router.get('/staff', protect, authorize('STAFF'), getStaffDashboard);

// GET /api/dashboard/admin — Admin platform metrics dashboard
router.get('/admin', protect, authorize('ADMIN'), getAdminDashboard);

export default router;
