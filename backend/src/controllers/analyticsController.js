// src/controllers/analyticsController.js
// Statistical analytics and trend detection controller.
//
// Endpoints:
//   GET /api/analytics/emerging-issues — Statistically detected issue clusters (STAFF/ADMIN)

import { detectEmergingIssues } from '../utils/complaintHelpers.js';

// ===========================================================================
// GET /api/analytics/emerging-issues
// STAFF / ADMIN only — 14-day rolling window surge detector.
// Identifies complaint-category/location patterns according to PROJECT_CONTEXT.md:
//   - recent 7 days vs previous 7 days
//   - recent >= 3 and increase >= 25%
//   - flags HIGH, MEDIUM, LOW risk
// ===========================================================================
export const getEmergingIssues = async (req, res) => {
  try {
    const issues = await detectEmergingIssues();
    return res.status(200).json(issues);
  } catch (err) {
    console.error('getEmergingIssues error:', err.message);
    return res.status(500).json({ message: 'Server error analyzing emerging issues.' });
  }
};
