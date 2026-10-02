// src/controllers/userController.js
// User profile and Admin user/staff management.
// Route → Controller → Model (no service/repository layer).

import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Department from '../models/Department.js';

// ---------------------------------------------------------------------------
// Helper — safe user projection (never exposes passwordHash)
// ---------------------------------------------------------------------------
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  createdAt: user.createdAt,
});

// ===========================================================================
// GET /api/users/profile
// Protected — get logged-in user profile.
// ===========================================================================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('department', 'name description')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found.' });

    return res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    console.error('getProfile error:', err.message);
    return res.status(500).json({ message: 'Server error fetching profile.' });
  }
};

// ===========================================================================
// PUT /api/users/profile
// Protected — update own name and email.
// Role and department cannot be modified through this endpoint.
// ===========================================================================
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ message: 'Please provide name or email to update.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters.' });
      }
      user.name = name.trim();
    }

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const existing = await User.findOne({
        email: cleanEmail,
        _id: { $ne: user._id },
      });
      if (existing) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }
      user.email = cleanEmail;
    }

    await user.save();

    const populated = await User.findById(user._id)
      .populate('department', 'name description')
      .lean();

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: safeUser(populated),
    });
  } catch (err) {
    console.error('updateProfile error:', err.message);
    return res.status(500).json({ message: 'Server error updating profile.' });
  }
};

// ===========================================================================
// GET /api/users
// ADMIN only — directory of platform users and staff.
// Query filters: ?search=keyword & ?role=STAFF
// ===========================================================================
export const listUsers = async (req, res) => {
  try {
    const filter = {};

    if (req.query.role) {
      const allowedRoles = ['CITIZEN', 'STAFF', 'ADMIN'];
      const targetRole = req.query.role.toUpperCase();
      if (allowedRoles.includes(targetRole)) {
        filter.role = targetRole;
      }
    }

    if (req.query.search) {
      const term = req.query.search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .populate('department', 'name description')
      .sort({ createdAt: -1 })
      .lean();

    const sanitizedUsers = users.map(safeUser);

    return res.status(200).json({ users: sanitizedUsers });
  } catch (err) {
    console.error('listUsers error:', err.message);
    return res.status(500).json({ message: 'Server error listing users.' });
  }
};

// ===========================================================================
// POST /api/users
// ADMIN only — create a managed staff or citizen user.
// Hashes password with bcrypt, validates department reference for staff.
// ===========================================================================
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, departmentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const targetRole = (role || 'CITIZEN').toUpperCase();
    if (!['CITIZEN', 'STAFF'].includes(targetRole)) {
      return res.status(400).json({ message: 'Managed user role must be CITIZEN or STAFF.' });
    }

    let department = null;
    if (targetRole === 'STAFF') {
      if (!departmentId) {
        return res.status(400).json({ message: 'Department is required for staff members.' });
      }
      try {
        department = await Department.findById(departmentId).lean();
      } catch {
        return res.status(400).json({ message: 'Invalid department ID format.' });
      }
      if (!department) {
        return res.status(404).json({ message: 'Department not found.' });
      }
      if (!department.active) {
        return res.status(400).json({ message: 'Cannot assign staff to an inactive department.' });
      }
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: targetRole,
      department: targetRole === 'STAFF' ? departmentId : null,
    });

    const populated = await User.findById(newUser._id)
      .populate('department', 'name description')
      .lean();

    return res.status(201).json({
      message: `${targetRole} user created successfully.`,
      user: safeUser(populated),
    });
  } catch (err) {
    console.error('createUser error:', err.message);
    return res.status(500).json({ message: 'Server error creating user.' });
  }
};

// ===========================================================================
// GET /api/users/:id
// ADMIN only — get single user details.
// ===========================================================================
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department', 'name description')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found.' });

    return res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    console.error('getUserById error:', err.message);
    return res.status(500).json({ message: 'Server error fetching user.' });
  }
};
