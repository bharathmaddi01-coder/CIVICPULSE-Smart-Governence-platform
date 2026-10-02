// src/routes/complaintRoutes.js
// All complaint routes — mounted at /api/complaints in app.js.
//
// IMPORTANT: /my and /assigned must be defined BEFORE /:id
// so Express matches them before treating "my"/"assigned" as an ObjectId.

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createComplaint,
  getMyComplaints,
  getAssignedComplaints,
  getComplaintById,
  updateComplaint,
  verifyComplaint,
  deleteComplaint,
  getComplaintImpactScore,
  getRelatedComplaints,
  getComplaintTimeline,
  getAllComplaints,
  assignComplaintStaff,
} from '../controllers/complaintController.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Static sub-path routes — must come BEFORE /:id
// ---------------------------------------------------------------------------

// GET /api/complaints/my — Citizen: view own complaints
router.get('/my', protect, authorize('CITIZEN'), getMyComplaints);

// GET /api/complaints/assigned — Staff: view assigned queue
router.get('/assigned', protect, authorize('STAFF'), getAssignedComplaints);

// ---------------------------------------------------------------------------
// Root routes
// ---------------------------------------------------------------------------

// GET /api/complaints — Admin: platform oversight (?search=, ?status=, ?departmentId=)
router.get('/', protect, authorize('ADMIN'), getAllComplaints);

// POST /api/complaints — Citizen: submit new complaint
router.post('/', protect, authorize('CITIZEN'), createComplaint);

// ---------------------------------------------------------------------------
// Dynamic :id sub-resource routes — must come BEFORE /:id (or after, but /:id/:sub is distinct)
// ---------------------------------------------------------------------------

// PUT /api/complaints/:id/assign — Admin: assign or reassign complaint staff
router.put('/:id/assign', protect, authorize('ADMIN'), assignComplaintStaff);

// GET /api/complaints/:id/impact-score — Explainable civic impact score (Scoped)
router.get('/:id/impact-score', protect, getComplaintImpactScore);

// GET /api/complaints/:id/related — Top similar complaints (Scoped)
router.get('/:id/related', protect, getRelatedComplaints);

// GET /api/complaints/:id/timeline — Complaint timeline history (Scoped)
router.get('/:id/timeline', protect, getComplaintTimeline);

// ---------------------------------------------------------------------------
// Dynamic :id routes
// ---------------------------------------------------------------------------

// GET /api/complaints/:id — Scoped by role (Citizen/Staff/Admin)
router.get('/:id', protect, getComplaintById);

// PUT /api/complaints/:id — Staff/Admin: update status, remarks, resolution
router.put('/:id', protect, authorize('STAFF', 'ADMIN'), updateComplaint);

// POST /api/complaints/:id/verify — Citizen: verify or reject resolution
router.post('/:id/verify', protect, authorize('CITIZEN'), verifyComplaint);

// DELETE /api/complaints/:id — Admin: permanent delete
router.delete('/:id', protect, authorize('ADMIN'), deleteComplaint);

export default router;
