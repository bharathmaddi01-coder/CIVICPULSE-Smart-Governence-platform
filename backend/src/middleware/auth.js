// src/middleware/auth.js
// JWT authentication middleware.
//
// Usage:
//   import { protect } from '../middleware/auth.js';
//   router.get('/protected-route', protect, controllerFn);
//
// The `protect` middleware:
//   1. Reads the Authorization header.
//   2. Expects: "Bearer <token>"
//   3. Verifies the token with JWT_SECRET.
//   4. Injects the decoded payload into req.user.
//   5. Calls next() on success.
//   6. Returns 401 on any failure.
//
// The `authorize` middleware factory:
//   Restricts a route to specific roles.
//   Must be used AFTER `protect` (req.user must exist).
//   Usage: authorize('ADMIN', 'STAFF')

import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// protect — verify JWT and inject req.user
// ---------------------------------------------------------------------------
export const protect = (req, res, next) => {
  // 1. Check the Authorization header exists
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // 2. Extract the token (everything after "Bearer ")
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token missing.' });
  }

  // 3. Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded && decoded.role) {
      decoded.role = decoded.role.toUpperCase();
    }
    req.user = decoded; // { id, email, name, role, iat, exp }
    next();
  } catch (err) {
    // jwt.verify throws on expired or tampered tokens
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// ---------------------------------------------------------------------------
// authorize — role-based access control (RBAC)
// Must be used after protect.
// Example: router.delete('/:id', protect, authorize('ADMIN'), deleteComplaint)
// ---------------------------------------------------------------------------
export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user?.role || '').toUpperCase();
    const allowed = roles.map((r) => r.toUpperCase());
    if (!req.user || !allowed.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied. Requires role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

// ---------------------------------------------------------------------------
// optionalProtect — silently tries to decode a token if one is present.
// Does NOT reject the request if the token is missing or invalid.
// Used on public routes that have an optional admin-only view (e.g. GET /departments).
// ---------------------------------------------------------------------------
export const optionalProtect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Token is invalid/expired — treat the request as unauthenticated
      req.user = null;
    }
  }
  next(); // Always continue — route is still public
};

