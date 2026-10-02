// src/utils/complaintHelpers.js
// Shared helper functions used by complaintController.js.
// No routes, no controllers — pure business logic utilities.
//
// Functions exported:
//   autoAssignStaff(complaint)  — find least-loaded staff and assign
//   createNotification(userId, message, complaintId)  — save in-app notification

import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';

// ---------------------------------------------------------------------------
// createNotification
// Saves one in-app Notification document for the given user.
// IN-APP ONLY — no email, SMS, or external service.
// Called after every significant complaint lifecycle event.
//
// Parameters:
//   userId      — ObjectId of the recipient user
//   message     — human-readable notification text
//   complaintId — ObjectId of the related complaint (or null)
// ---------------------------------------------------------------------------
export const createNotification = async (userId, message, complaintId = null) => {
  try {
    await Notification.create({
      user: userId,
      message,
      complaint: complaintId || null,
      read: false,
    });
  } catch (err) {
    // Notification failure must NEVER crash the main complaint workflow.
    // Log it and continue.
    console.error('createNotification error:', err.message);
  }
};

// ---------------------------------------------------------------------------
// autoAssignStaff
// Implements the Least-Loaded Staff Auto-Assignment algorithm from PROJECT_CONTEXT.md.
//
// Algorithm:
//   1. Find all STAFF users in the complaint's department.
//   2. For each staff member, count their currently ACTIVE complaints.
//      Active = status NOT IN ['RESOLVED', 'CLOSED', 'REJECTED']
//   3. Select the staff member with the lowest active complaint count.
//   4. If tied, select the first result (insertion order).
//   5. If no eligible staff exists, return null — complaint stays PENDING.
//
// Modifies the complaint document in place (saves to MongoDB).
// Adds an ASSIGNED history event.
// Sends an in-app notification to the assigned staff member.
//
// Parameters:
//   complaint — a Mongoose Complaint document (not lean)
//
// Returns:
//   The updated complaint document after assignment, or the unchanged document
//   if no eligible staff was found.
// ---------------------------------------------------------------------------
export const autoAssignStaff = async (complaint) => {
  try {
    // 1. Find all STAFF users belonging to this department
    const staffMembers = await User.find({
      role: 'STAFF',
      department: complaint.department,
    }).lean();

    if (!staffMembers || staffMembers.length === 0) {
      // No staff in this department — complaint stays PENDING
      return complaint;
    }

    // 2. Count active complaints per staff member
    // Active statuses: PENDING, ASSIGNED, IN_PROGRESS, REOPENED
    // Completed statuses (excluded from workload): RESOLVED, CLOSED, REJECTED
    const ACTIVE_STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'];

    const workloadCounts = await Promise.all(
      staffMembers.map(async (staff) => {
        const count = await Complaint.countDocuments({
          assignedStaff: staff._id,
          status: { $in: ACTIVE_STATUSES },
        });
        return { staff, count };
      })
    );

    // 3. Select staff with lowest active count
    workloadCounts.sort((a, b) => a.count - b.count);
    const { staff: selectedStaff } = workloadCounts[0];

    // 4. Update the complaint: assign staff, change status, add history event
    complaint.assignedStaff = selectedStaff._id;
    complaint.status = 'ASSIGNED';
    complaint.history.push({
      eventType: 'ASSIGNED',
      description: `Complaint assigned to ${selectedStaff.name} (${selectedStaff.email}).`,
      performedBy: null,         // system action — no user triggered this
      performedByName: 'System', // clear label for the timeline
      eventAt: new Date(),
    });
    complaint.updatedAt = new Date();

    await complaint.save();

    // 5. Send in-app notification to the assigned staff member
    await createNotification(
      selectedStaff._id,
      `You have been assigned complaint ${complaint.reference}: "${complaint.title}".`,
      complaint._id
    );

    return complaint;
  } catch (err) {
    // Assignment failure must NOT crash the complaint creation response.
    // Log it and return the unmodified complaint (it will stay PENDING).
    console.error('autoAssignStaff error:', err.message);
    return complaint;
  }
};

// ---------------------------------------------------------------------------
// calculateImpactScore
// Implements Explainable Civic Impact Scoring (5 weighted factors, 0–100)
// from PROJECT_CONTEXT.md:
//   Severity (30), Affected Citizens (25), Recurrence (20), Age (15), Location (10).
// ---------------------------------------------------------------------------
export const calculateImpactScore = (complaint) => {
  const text = [complaint.category, complaint.title, complaint.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // 1. Severity factor (weight: 30)
  let severityLevel = 3;
  if (/danger|accident|flood|fire|outage|unsafe|health/.test(text)) {
    severityLevel = 5;
  } else if (/broken|damaged|leak|pothole|garbage/.test(text)) {
    severityLevel = 4;
  }
  const severity = Math.round((severityLevel * 30) / 5);

  // 2. Affected Citizens factor (weight: 25)
  const loc = (complaint.location || '').toLowerCase();
  const affectedMult = loc.includes('school') || loc.includes('hospital') ? 1.0 : 0.6;
  const affectedCitizens = Math.round(25 * affectedMult);

  // 3. Recurrence factor (weight: 20)
  const recurrenceMult = text.includes('again') || text.includes('repeated') ? 1.0 : 0.5;
  const recurrence = Math.round(20 * recurrenceMult);

  // 4. Age factor (weight: 15)
  const createdAtTime = complaint.createdAt ? new Date(complaint.createdAt).getTime() : Date.now();
  const ageDays = Math.max(0, (Date.now() - createdAtTime) / (1000 * 60 * 60 * 24));
  const age = Math.round(15 * Math.min(1.0, ageDays / 30));

  // 5. Location factor (weight: 10)
  const hasCoords =
    complaint.latitude != null &&
    complaint.longitude != null &&
    !isNaN(complaint.latitude) &&
    !isNaN(complaint.longitude);
  const location = Math.round(10 * (hasCoords ? 0.8 : 0.4));

  const total = Math.max(0, Math.min(100, severity + affectedCitizens + recurrence + age + location));

  return {
    impactScore: total,
    breakdown: {
      severity,
      affectedCitizens,
      recurrence,
      age,
      location,
    },
  };
};

// ---------------------------------------------------------------------------
// calculateSimilarity
// Compares two complaints for similarity score (0–100) using the exact formula:
//   - Category match (must match exactly or score is 0)
//   - Token Jaccard overlap (>3 chars) * 50%
//   - Haversine distance (<= 2 km -> +30%)
//   - Time window (<= 30 days -> +20%)
// ---------------------------------------------------------------------------
const extractWords = (str) => {
  if (!str) return new Set();
  const tokens = str.toLowerCase().split(/[^a-z0-9]+/);
  return new Set(tokens.filter((w) => w.length > 3));
};

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c; // Earth radius in km
};

export const calculateSimilarity = (a, b) => {
  if (
    !a.category ||
    !b.category ||
    a.category.trim().toLowerCase() !== b.category.trim().toLowerCase()
  ) {
    return 0;
  }

  const left = extractWords(`${a.title || ''} ${a.description || ''}`);
  const right = extractWords(`${b.title || ''} ${b.description || ''}`);

  let intersectionCount = 0;
  for (const w of left) {
    if (right.has(w)) intersectionCount++;
  }
  const maxWords = Math.max(left.size, right.size);
  const textScore =
    left.size === 0 && right.size === 0
      ? 0
      : Math.round((100 * intersectionCount) / maxWords);

  const dist = haversineDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
  const proximity = dist <= 2 ? 30 : 0;

  const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Date.now();
  const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Date.now();
  const timeDiffMs = Math.abs(timeA - timeB);
  const timeScore = timeDiffMs <= 30 * 24 * 60 * 60 * 1000 ? 20 : 0;

  return Math.min(100, Math.round(textScore * 0.5) + proximity + timeScore);
};

// ---------------------------------------------------------------------------
// getSimilarComplaints
// Returns top related complaints with similarity >= threshold (default 50%),
// excluding the source complaint, sorted descending by similarity, limit (default 10).
// ---------------------------------------------------------------------------
export const getSimilarComplaints = async (sourceComplaint, limit = 10, threshold = 50) => {
  const candidates = await Complaint.find({
    _id: { $ne: sourceComplaint._id },
    category: sourceComplaint.category,
  }).lean();

  const results = [];
  for (const other of candidates) {
    const sim = calculateSimilarity(sourceComplaint, other);
    if (sim >= threshold) {
      results.push({
        complaintId: other._id,
        reference: other.reference,
        title: other.title,
        similarity: sim,
        category: other.category,
        status: other.status,
        createdAt: other.createdAt,
      });
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, limit);
};

// ---------------------------------------------------------------------------
// detectEmergingIssues
// 14-day rolling window surge detector from PROJECT_CONTEXT.md:
// Compares recent 7 days vs previous 7 days (days 8–14) grouped by category + location.
// Flags HIGH, MEDIUM, LOW risk. Filters recent >= 3 and increase >= 25%.
// ---------------------------------------------------------------------------
export const detectEmergingIssues = async () => {
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const currentStart = new Date(now - SEVEN_DAYS_MS);
  const previousStart = new Date(now - 2 * SEVEN_DAYS_MS);

  const complaints = await Complaint.find({
    createdAt: { $gte: previousStart },
  }).lean();

  const groups = {};
  for (const c of complaints) {
    const area = (c.location || 'Unknown').trim();
    const key = `${c.category}|${area}`;
    if (!groups[key]) {
      groups[key] = {
        category: c.category,
        area,
        location: area,
        recent: 0,
        previous: 0,
      };
    }
    const cTime = new Date(c.createdAt).getTime();
    if (cTime >= currentStart.getTime()) {
      groups[key].recent++;
    } else {
      groups[key].previous++;
    }
  }

  const issues = [];
  for (const g of Object.values(groups)) {
    const { recent, previous } = g;
    const increase =
      previous === 0 ? (recent > 0 ? 100 : 0) : ((recent - previous) * 100) / previous;

    const risk =
      recent >= 10 && increase >= 75
        ? 'HIGH'
        : recent >= 5 && increase >= 40
        ? 'MEDIUM'
        : 'LOW';

    if (recent >= 3 && increase >= 25) {
      issues.push({
        category: g.category,
        area: g.area,
        location: g.location,
        recentComplaints: recent,
        increasePercent: Math.round(increase * 10) / 10,
        risk,
      });
    }
  }

  issues.sort((a, b) => b.increasePercent - a.increasePercent);
  return issues;
};
