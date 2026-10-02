// src/models/Department.js
// Departments that handle complaints.
// The keyword auto-routing engine matches complaint text against department names.
// Departments can be deactivated (active: false) instead of deleted so that
// existing complaint references remain valid.

import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,   // department names must be globally unique
    trim: true,
    minlength: 2,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
  },
  // Soft-delete flag. Inactive departments cannot receive new complaints.
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Department', departmentSchema);
