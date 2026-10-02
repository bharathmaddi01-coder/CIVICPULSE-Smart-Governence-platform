// src/controllers/authController.js
// Handles user registration and login.
// Route → Controller → Model (no service layer).

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ---------------------------------------------------------------------------
// Helper — build the JWT payload and sign it
// Payload: { id, email, name, role }  —  passwordHash is NEVER included.
// ---------------------------------------------------------------------------
const signToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    name: user.name,
    role: (user.role || 'CITIZEN').toUpperCase(),
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
};

// ---------------------------------------------------------------------------
// Helper — build the safe user object returned in API responses.
// passwordHash is explicitly excluded.
// ---------------------------------------------------------------------------
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: (user.role || 'CITIZEN').toUpperCase(),
  department: user.department,
  createdAt: user.createdAt,
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// Public — creates a new user account.
//
// Accepted body:
//   { name, email, password }
//
// Rules (from PROJECT_CONTEXT.md):
//   - Public registration always creates a CITIZEN account.
//   - ADMIN and STAFF roles cannot be self-registered.
//   - Duplicate email returns 409.
//   - Password is hashed with bcrypt (10 rounds) before saving.
// ---------------------------------------------------------------------------
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // --- 1. Validate required fields ---
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email, and password are required.',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // --- 2. Check for duplicate email ---
    // email is stored lowercase in the schema, so compare lowercase
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    // --- 3. Hash the password ---
    const passwordHash = await bcrypt.hash(password, 10);

    // --- 4. Create the user ---
    // Public registration always results in a CITIZEN account.
    // Role cannot be overridden by the request body.
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'CITIZEN', // hardcoded — public users cannot self-assign other roles
      department: null,
    });

    // --- 5. Return the new user (no token on registration — must log in) ---
    return res.status(201).json({
      message: 'Registration successful. Please log in.',
      user: safeUser(user),
    });
  } catch (err) {
    console.error('register error:', err.message);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Public — verifies credentials and returns a JWT.
//
// Accepted body:
//   { email, password }
//
// Security note:
//   Invalid credentials always return the same 401 message regardless of
//   whether the email exists — this prevents email enumeration attacks.
// ---------------------------------------------------------------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- 1. Validate required fields ---
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // --- 2. Find the user by email ---
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // --- 3. Verify password (same message for missing user or wrong password) ---
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // --- 4. Sign and return the JWT ---
    const token = signToken(user);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('login error:', err.message);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/auth/me
// Protected — returns current authenticated user profile.
// ---------------------------------------------------------------------------
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('department', 'name description').lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    console.error('getMe error:', err.message);
    return res.status(500).json({ message: 'Server error fetching user.' });
  }
};

