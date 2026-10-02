// src/routes/departmentRoutes.js
// Department routes — mounted at /api/departments in app.js.
//
// Public:
//   GET  /api/departments          — list active departments (or all if Admin + ?all=true)
//
// Admin only:
//   POST   /api/departments        — create department
//   PUT    /api/departments/:id    — update department (name, description, active)
//   DELETE /api/departments/:id    — deactivate department (soft delete)

import express from 'express';
import { protect, authorize, optionalProtect } from '../middleware/auth.js';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
} from '../controllers/departmentController.js';

const router = express.Router();

// GET /api/departments — public, but optionalProtect lets Admin use ?all=true
router.get('/', optionalProtect, getDepartments);

// POST /api/departments — Admin only
router.post('/', protect, authorize('ADMIN'), createDepartment);

// PUT /api/departments/:id — Admin only
router.put('/:id', protect, authorize('ADMIN'), updateDepartment);

// DELETE /api/departments/:id — Admin only (soft-delete: sets active: false)
router.delete('/:id', protect, authorize('ADMIN'), deactivateDepartment);

export default router;
