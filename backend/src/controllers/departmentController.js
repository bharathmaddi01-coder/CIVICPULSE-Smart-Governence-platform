// src/controllers/departmentController.js
// Department management — Admin only (create, update, deactivate).
// Public/authenticated users can list active departments (needed for complaint form).
//
// Route → Controller → Department Model → MongoDB
// No service layer, no repository, no abstractions.

import Department from '../models/Department.js';

// ---------------------------------------------------------------------------
// GET /api/departments
// Public — returns all ACTIVE departments.
// Used by:
//   - Complaint submission form (Citizen selects department)
//   - Keyword auto-routing fallback list
//   - Admin department list page (Admin also sees inactive via query param)
//
// Query params:
//   ?all=true  → Admin view: return all departments (active + inactive)
//               Only honoured when the caller is authenticated as ADMIN.
//               Regular callers always receive only active departments.
// ---------------------------------------------------------------------------
export const getDepartments = async (req, res) => {
  try {
    // If the caller is an authenticated ADMIN and explicitly requests all records
    const showAll = req.user?.role === 'ADMIN' && req.query.all === 'true';

    const filter = showAll ? {} : { active: true };

    const departments = await Department.find(filter).sort({ name: 1 });

    return res.status(200).json({ departments });
  } catch (err) {
    console.error('getDepartments error:', err.message);
    return res.status(500).json({ message: 'Server error fetching departments.' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/departments
// Admin only — create a new department.
//
// Body: { name, description }
//
// Rules:
//   - name and description are required.
//   - name must be at least 2 characters.
//   - description must be at least 5 characters.
//   - Duplicate names are rejected (409).
//   - New departments are active by default.
// ---------------------------------------------------------------------------
export const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    // --- 1. Validate required fields ---
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Department name is required.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Department name must be at least 2 characters.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Department description is required.' });
    }
    if (description.trim().length < 5) {
      return res.status(400).json({ message: 'Department description must be at least 5 characters.' });
    }

    // --- 2. Check for duplicate name (case-insensitive) ---
    const existing = await Department.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (existing) {
      return res.status(409).json({ message: `Department "${name.trim()}" already exists.` });
    }

    // --- 3. Create the department ---
    const department = await Department.create({
      name: name.trim(),
      description: description.trim(),
      active: true,
    });

    return res.status(201).json({
      message: 'Department created successfully.',
      department,
    });
  } catch (err) {
    // Mongoose unique index violation (race condition edge case)
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Department name already exists.' });
    }
    console.error('createDepartment error:', err.message);
    return res.status(500).json({ message: 'Server error creating department.' });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/departments/:id
// Admin only — update a department's name, description, and/or active status.
//
// Body: { name?, description?, active? }
//
// Rules:
//   - At least one field must be provided.
//   - If changing the name, the new name must not duplicate an existing one.
//   - Existing complaints referencing this department are NOT affected by
//     name changes (they store the ObjectId reference, not the name string).
//   - The active flag can be toggled here (activate or deactivate).
// ---------------------------------------------------------------------------
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, active } = req.body;

    // --- 1. Find the department ---
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    // --- 2. Validate provided fields ---
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Department name cannot be empty.' });
      }
      if (name.trim().length < 2) {
        return res.status(400).json({ message: 'Department name must be at least 2 characters.' });
      }

      // Check for duplicate name (exclude the current department from the check)
      const duplicate = await Department.findOne({
        _id: { $ne: id },
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
      });
      if (duplicate) {
        return res.status(409).json({ message: `Department "${name.trim()}" already exists.` });
      }

      department.name = name.trim();
    }

    if (description !== undefined) {
      if (!description.trim() || description.trim().length < 5) {
        return res.status(400).json({ message: 'Description must be at least 5 characters.' });
      }
      department.description = description.trim();
    }

    if (active !== undefined) {
      if (typeof active !== 'boolean') {
        return res.status(400).json({ message: 'active must be true or false.' });
      }
      department.active = active;
    }

    await department.save();

    return res.status(200).json({
      message: 'Department updated successfully.',
      department,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Department name already exists.' });
    }
    console.error('updateDepartment error:', err.message);
    return res.status(500).json({ message: 'Server error updating department.' });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/departments/:id
// Admin only — SOFT DELETE (sets active: false).
//
// Per PROJECT_CONTEXT.md:
//   Inactive departments cannot receive new complaints BUT must remain in
//   MongoDB so that existing complaint ObjectId references stay valid.
//   Physical deletion is therefore NOT performed.
//
// This endpoint does NOT permanently delete the document — it only
// sets active: false, which is the same as PUT /:id with { active: false }.
// A separate endpoint exists for clarity and to match REST conventions.
// ---------------------------------------------------------------------------
export const deactivateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    if (!department.active) {
      return res.status(400).json({ message: 'Department is already inactive.' });
    }

    department.active = false;
    await department.save();

    return res.status(200).json({
      message: 'Department deactivated. It will no longer accept new complaints.',
      department,
    });
  } catch (err) {
    console.error('deactivateDepartment error:', err.message);
    return res.status(500).json({ message: 'Server error deactivating department.' });
  }
};
