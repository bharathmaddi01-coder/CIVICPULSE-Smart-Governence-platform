// src/routes/analyticsRoutes.js
// Analytics routes — mounted at /api/analytics in app.js.

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getEmergingIssues } from '../controllers/analyticsController.js';

const router = express.Router();

// GET /api/analytics/emerging-issues — Staff/Admin: statistically detected issue clusters
router.get('/emerging-issues', protect, authorize('STAFF', 'ADMIN'), getEmergingIssues);

export default router;
