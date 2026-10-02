// src/models/User.js
// User accounts for all three roles: CITIZEN, STAFF, ADMIN.
// Passwords are stored in the passwordHash field but are NOT hashed here.
// Hashing is done in authController during registration (bcryptjs, 10 rounds).

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
  },
  email: {
    type: String,
    required: true,
    unique: true,   // enforces uniqueness + creates an index automatically
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['CITIZEN', 'STAFF', 'ADMIN'],
    default: 'CITIZEN',
  },
  // Only populated for STAFF accounts — references the department they belong to.
  // Null for CITIZEN and ADMIN.
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('User', userSchema);
