// src/controllers/complaintController.js
// Full complaint lifecycle controller.
// Route → Controller → Model → MongoDB  (no service/repository layer)
//
// Implemented handlers:
//   createComplaint       POST   /api/complaints              (CITIZEN)
//   getMyComplaints       GET    /api/complaints/my           (CITIZEN)
//   getAssignedComplaints GET    /api/complaints/assigned     (STAFF)
//   getComplaintById      GET    /api/complaints/:id          (scoped by role)
//   updateComplaint       PUT    /api/complaints/:id          (STAFF/ADMIN)
//   verifyComplaint       POST   /api/complaints/:id/verify   (CITIZEN owner)
//   deleteComplaint       DELETE /api/complaints/:id          (ADMIN)

import Complaint from '../models/Complaint.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import {
  autoAssignStaff,
  createNotification,
  calculateImpactScore,
  getSimilarComplaints,
} from '../utils/complaintHelpers.js';

// ---------------------------------------------------------------------------
// Internal helper — generate unique human-readable reference  CP-XXXX
// ---------------------------------------------------------------------------
const generateReference = async () => {
  const last = await Complaint.findOne({}, { reference: 1 })
    .sort({ createdAt: -1 })
    .lean();

  let nextNum = 1001;
  if (last && last.reference) {
    const num = parseInt(last.reference.split('-')[1], 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  return `CP-${String(nextNum).padStart(4, '0')}`;
};

// ---------------------------------------------------------------------------
// Internal helper — standard populate for complaint queries
// ---------------------------------------------------------------------------
const populateComplaint = (query) =>
  query
    .populate('citizen', 'name email')
    .populate('department', 'name description')
    .populate('assignedStaff', 'name email');

// ===========================================================================
// POST /api/complaints
// CITIZEN only — submit a new complaint, then auto-assign to staff.
// ===========================================================================
export const createComplaint = async (req, res) => {
  try {
    const { title, category, description, location, latitude, longitude, departmentId, photoData } = req.body;

    // --- Validate required fields ---
    if (!title || !title.trim())               return res.status(400).json({ message: 'Complaint title is required.' });
    if (title.trim().length < 3)               return res.status(400).json({ message: 'Title must be at least 3 characters.' });
    if (!category || !category.trim())         return res.status(400).json({ message: 'Complaint category is required.' });
    if (category.trim().length < 2)            return res.status(400).json({ message: 'Category must be at least 2 characters.' });
    if (!description || !description.trim())   return res.status(400).json({ message: 'Complaint description is required.' });
    if (description.trim().length < 10)        return res.status(400).json({ message: 'Description must be at least 10 characters.' });
    if (!location || !location.trim())         return res.status(400).json({ message: 'Location address is required.' });
    if (!departmentId)                         return res.status(400).json({ message: 'Department is required.' });

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (latitude === undefined || latitude === null || latitude === '') return res.status(400).json({ message: 'Latitude is required.' });
    if (longitude === undefined || longitude === null || longitude === '') return res.status(400).json({ message: 'Longitude is required.' });
    if (isNaN(lat) || lat < -90  || lat > 90)  return res.status(400).json({ message: 'Latitude must be between -90 and 90.' });
    if (isNaN(lon) || lon < -180 || lon > 180) return res.status(400).json({ message: 'Longitude must be between -180 and 180.' });

    // --- Validate department ---
    let department;
    try {
      department = await Department.findById(departmentId).lean();
    } catch {
      return res.status(400).json({ message: 'Invalid department ID format.' });
    }
    if (!department)         return res.status(404).json({ message: 'Department not found.' });
    if (!department.active)  return res.status(400).json({ message: 'This department is inactive and cannot accept new complaints.' });

    // --- Generate reference ---
    const reference = await generateReference();

    // --- Create complaint with CREATED history event ---
    const complaint = await Complaint.create({
      reference,
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      location: location.trim(),
      latitude: lat,
      longitude: lon,
      photoData: photoData || null,
      status: 'PENDING',
      citizen: req.user.id,   // from JWT — never from request body
      department: departmentId,
      assignedStaff: null,
      remarks: null,
      resolution: null,
      verificationStatus: 'PENDING',
      verifiedAt: null,
      reopenReason: null,
      history: [{
        eventType: 'CREATED',
        description: `Complaint submitted by ${req.user.name}.`,
        performedBy: req.user.id,
        performedByName: req.user.name,
      }],
    });

    // --- Auto-assign to least-loaded staff in the department ---
    const assignedComplaint = await autoAssignStaff(complaint);

    // --- Return populated complaint ---
    const populated = await populateComplaint(
      Complaint.findById(assignedComplaint._id)
    ).lean();

    return res.status(201).json({
      message: 'Complaint submitted successfully.',
      reference: populated.reference,
      complaint: populated,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(500).json({ message: 'Reference conflict. Please try again.' });
    console.error('createComplaint error:', err.message);
    return res.status(500).json({ message: 'Server error submitting complaint.' });
  }
};

// ===========================================================================
// GET /api/complaints/my
// CITIZEN only — list their own complaints.
// Query params: ?status=PENDING&search=pothole
// ===========================================================================
export const getMyComplaints = async (req, res) => {
  try {
    const filter = { citizen: req.user.id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const complaints = await populateComplaint(
      Complaint.find(filter).sort({ createdAt: -1 })
    ).lean();

    return res.status(200).json({ complaints });
  } catch (err) {
    console.error('getMyComplaints error:', err.message);
    return res.status(500).json({ message: 'Server error fetching complaints.' });
  }
};

// ===========================================================================
// GET /api/complaints/assigned
// STAFF only — list complaints assigned to the logged-in staff member.
// Query params: ?status=IN_PROGRESS&search=road
// ===========================================================================
export const getAssignedComplaints = async (req, res) => {
  try {
    const filter = { assignedStaff: req.user.id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const complaints = await populateComplaint(
      Complaint.find(filter).sort({ createdAt: -1 })
    ).lean();

    return res.status(200).json({ complaints });
  } catch (err) {
    console.error('getAssignedComplaints error:', err.message);
    return res.status(500).json({ message: 'Server error fetching assigned complaints.' });
  }
};

// ===========================================================================
// GET /api/complaints/:id
// Scoped access by role:
//   CITIZEN — only their own complaint
//   STAFF   — only their assigned complaint
//   ADMIN   — any complaint
// ===========================================================================
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await populateComplaint(
      Complaint.findById(req.params.id)
    ).lean();

    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    const { role, id: userId } = req.user;

    if (role === 'CITIZEN' && complaint.citizen._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. This is not your complaint.' });
    }
    if (role === 'STAFF' && (!complaint.assignedStaff || complaint.assignedStaff._id.toString() !== userId)) {
      return res.status(403).json({ message: 'Access denied. This complaint is not assigned to you.' });
    }

    return res.status(200).json({ complaint });
  } catch (err) {
    console.error('getComplaintById error:', err.message);
    return res.status(500).json({ message: 'Server error fetching complaint.' });
  }
};

// ===========================================================================
// PUT /api/complaints/:id
// STAFF/ADMIN — update complaint status, remarks, resolution.
//
// Valid staff transitions (from PROJECT_CONTEXT.md):
//   ASSIGNED  → IN_PROGRESS
//   REOPENED  → IN_PROGRESS
//   IN_PROGRESS → RESOLVED  (requires resolution note)
//   IN_PROGRESS → REJECTED  (requires remarks)
//
// ADMIN can also update remarks/resolution freely.
// ===========================================================================
export const updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    const { role, id: userId } = req.user;
    const { status, remarks, resolution } = req.body;

    // STAFF: can only update complaints assigned to them
    if (role === 'STAFF') {
      if (!complaint.assignedStaff || complaint.assignedStaff.toString() !== userId) {
        return res.status(403).json({ message: 'Access denied. This complaint is not assigned to you.' });
      }
    }

    // --- Define valid status transitions for Staff ---
    const VALID_TRANSITIONS = {
      ASSIGNED:    ['IN_PROGRESS'],
      REOPENED:    ['IN_PROGRESS'],
      IN_PROGRESS: ['RESOLVED', 'REJECTED'],
    };

    if (status) {
      const allowed = VALID_TRANSITIONS[complaint.status];
      if (!allowed || !allowed.includes(status)) {
        return res.status(400).json({
          message: `Invalid status transition: ${complaint.status} → ${status}.`,
        });
      }

      // RESOLVED requires a resolution note
      if (status === 'RESOLVED') {
        const resNote = resolution || complaint.resolution;
        if (!resNote || !resNote.trim()) {
          return res.status(400).json({ message: 'A resolution note is required to resolve a complaint.' });
        }
        complaint.resolution = resNote.trim();
      }

      // REJECTED requires remarks
      if (status === 'REJECTED') {
        const remark = remarks || complaint.remarks;
        if (!remark || !remark.trim()) {
          return res.status(400).json({ message: 'Remarks are required to reject a complaint.' });
        }
        complaint.remarks = remark.trim();
      }

      // Determine history event type
      let eventType = 'STATUS_CHANGED';
      let historyDesc = `Status changed from ${complaint.status} to ${status} by ${req.user.name}.`;

      if (status === 'IN_PROGRESS') {
        historyDesc = `Work started on this complaint by ${req.user.name}.`;
      } else if (status === 'RESOLVED') {
        eventType = 'RESOLVED';
        historyDesc = `Complaint resolved by ${req.user.name}. Resolution: ${complaint.resolution}`;
      } else if (status === 'REJECTED') {
        historyDesc = `Complaint rejected by ${req.user.name}. Reason: ${complaint.remarks}`;
      }

      complaint.history.push({
        eventType,
        description: historyDesc,
        performedBy: userId,
        performedByName: req.user.name,
        eventAt: new Date(),
      });

      const prevStatus = complaint.status;
      complaint.status = status;

      // --- Notify citizen of important status changes ---
      if (['IN_PROGRESS', 'RESOLVED', 'REJECTED'].includes(status)) {
        let notifMsg;
        if (status === 'IN_PROGRESS') {
          notifMsg = `Your complaint ${complaint.reference} is now being worked on.`;
        } else if (status === 'RESOLVED') {
          notifMsg = `Your complaint ${complaint.reference} has been resolved. Please review and verify the resolution.`;
        } else if (status === 'REJECTED') {
          notifMsg = `Your complaint ${complaint.reference} has been rejected. Reason: ${complaint.remarks}`;
        }
        await createNotification(complaint.citizen, notifMsg, complaint._id);
      }
    }

    // --- Update remarks/resolution independently (without status change) ---
    if (remarks && !status) {
      complaint.remarks = remarks.trim();
    }
    if (resolution && !status) {
      complaint.resolution = resolution.trim();
    }

    complaint.updatedAt = new Date();
    await complaint.save();

    const populated = await populateComplaint(
      Complaint.findById(complaint._id)
    ).lean();

    return res.status(200).json({
      message: 'Complaint updated successfully.',
      complaint: populated,
    });
  } catch (err) {
    console.error('updateComplaint error:', err.message);
    return res.status(500).json({ message: 'Server error updating complaint.' });
  }
};

// ===========================================================================
// POST /api/complaints/:id/verify
// CITIZEN only — verify or reject a RESOLVED complaint.
//
// Body: { accepted: true }   → RESOLVED → CLOSED
// Body: { accepted: false, reason: "..." } → RESOLVED → REOPENED
//
// Only the complaint's own citizen can call this.
// ===========================================================================
export const verifyComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    // --- Ownership check: only the complaint's own citizen ---
    if (complaint.citizen.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. This is not your complaint.' });
    }

    // --- Complaint must be RESOLVED to be verified ---
    if (complaint.status !== 'RESOLVED') {
      return res.status(400).json({
        message: `Complaint cannot be verified — current status is ${complaint.status}. Only RESOLVED complaints can be verified.`,
      });
    }

    const { accepted, reason } = req.body;

    if (accepted === undefined || accepted === null) {
      return res.status(400).json({ message: '"accepted" field is required (true or false).' });
    }

    if (accepted === true || accepted === 'true') {
      // ---- ACCEPT: RESOLVED → CLOSED ----
      complaint.verificationStatus = 'ACCEPTED';
      complaint.verifiedAt = new Date();
      complaint.status = 'CLOSED';

      complaint.history.push({
        eventType: 'VERIFIED',
        description: `Resolution accepted by ${req.user.name}. Complaint closed.`,
        performedBy: req.user.id,
        performedByName: req.user.name,
        eventAt: new Date(),
      });

      // Notify assigned staff
      if (complaint.assignedStaff) {
        await createNotification(
          complaint.assignedStaff,
          `Complaint ${complaint.reference} has been verified and closed by the citizen.`,
          complaint._id
        );
      }
    } else {
      // ---- REJECT (REOPEN): RESOLVED → REOPENED ----
      if (!reason || !reason.trim() || reason.trim().length < 5) {
        return res.status(400).json({ message: 'A reopen reason of at least 5 characters is required.' });
      }

      complaint.verificationStatus = 'REJECTED';
      complaint.reopenReason = reason.trim();
      complaint.status = 'REOPENED';

      complaint.history.push({
        eventType: 'REOPENED',
        description: `Resolution rejected by ${req.user.name}. Reason: ${reason.trim()}`,
        performedBy: req.user.id,
        performedByName: req.user.name,
        eventAt: new Date(),
      });

      // Notify assigned staff
      if (complaint.assignedStaff) {
        await createNotification(
          complaint.assignedStaff,
          `Complaint ${complaint.reference} has been reopened by the citizen. Reason: ${reason.trim()}`,
          complaint._id
        );
      }
    }

    complaint.updatedAt = new Date();
    await complaint.save();

    const populated = await populateComplaint(
      Complaint.findById(complaint._id)
    ).lean();

    return res.status(200).json({
      message: accepted === true || accepted === 'true'
        ? 'Complaint closed successfully.'
        : 'Complaint reopened. Staff will review the issue again.',
      complaint: populated,
    });
  } catch (err) {
    console.error('verifyComplaint error:', err.message);
    return res.status(500).json({ message: 'Server error verifying complaint.' });
  }
};

// ===========================================================================
// DELETE /api/complaints/:id
// ADMIN only — permanently delete a complaint.
// ===========================================================================
export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).lean();
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    await Complaint.deleteOne({ _id: req.params.id });

    return res.status(200).json({
      message: `Complaint ${complaint.reference} deleted permanently.`,
    });
  } catch (err) {
    console.error('deleteComplaint error:', err.message);
    return res.status(500).json({ message: 'Server error deleting complaint.' });
  }
};

// ===========================================================================
// GET /api/complaints/:id/impact-score
// Scoped access:
//   CITIZEN — only their own complaint
//   STAFF   — assigned complaint or in same department
//   ADMIN   — any complaint
// Returns: { impactScore: number, breakdown: { severity, affectedCitizens, recurrence, age, location } }
// ===========================================================================
export const getComplaintImpactScore = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).lean();
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    const { role, id: userId, department: userDept } = req.user;
    if (role === 'CITIZEN' && complaint.citizen.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. This is not your complaint.' });
    }
    if (role === 'STAFF') {
      const isAssigned = complaint.assignedStaff && complaint.assignedStaff.toString() === userId;
      const isSameDept = userDept && complaint.department && complaint.department.toString() === userDept.toString();
      if (!isAssigned && !isSameDept) {
        return res.status(403).json({ message: 'Access denied. This complaint is not assigned to you.' });
      }
    }

    const impact = calculateImpactScore(complaint);
    return res.status(200).json(impact);
  } catch (err) {
    console.error('getComplaintImpactScore error:', err.message);
    return res.status(500).json({ message: 'Server error computing impact score.' });
  }
};

// ===========================================================================
// GET /api/complaints/:id/related
// Scoped access:
//   CITIZEN — only for their own complaint
//   STAFF   — assigned complaint or in same department
//   ADMIN   — any complaint
// Returns: array of related complaints ({ complaintId, reference, title, similarity })
// ===========================================================================
export const getRelatedComplaints = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).lean();
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    const { role, id: userId, department: userDept } = req.user;
    if (role === 'CITIZEN' && complaint.citizen.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. This is not your complaint.' });
    }
    if (role === 'STAFF') {
      const isAssigned = complaint.assignedStaff && complaint.assignedStaff.toString() === userId;
      const isSameDept = userDept && complaint.department && complaint.department.toString() === userDept.toString();
      if (!isAssigned && !isSameDept) {
        return res.status(403).json({ message: 'Access denied. This complaint is not assigned to you.' });
      }
    }

    const related = await getSimilarComplaints(complaint);
    return res.status(200).json(related);
  } catch (err) {
    console.error('getRelatedComplaints error:', err.message);
    return res.status(500).json({ message: 'Server error fetching related complaints.' });
  }
};

// ===========================================================================
// GET /api/complaints/:id/timeline
// Scoped access: returns the embedded timeline/history of the complaint.
// ===========================================================================
export const getComplaintTimeline = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id, { history: 1, citizen: 1, assignedStaff: 1, department: 1 }).lean();
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    const { role, id: userId, department: userDept } = req.user;
    if (role === 'CITIZEN' && complaint.citizen.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. This is not your complaint.' });
    }
    if (role === 'STAFF') {
      const isAssigned = complaint.assignedStaff && complaint.assignedStaff.toString() === userId;
      const isSameDept = userDept && complaint.department && complaint.department.toString() === userDept.toString();
      if (!isAssigned && !isSameDept) {
        return res.status(403).json({ message: 'Access denied. This complaint is not assigned to you.' });
      }
    }

    return res.status(200).json(complaint.history || []);
  } catch (err) {
    console.error('getComplaintTimeline error:', err.message);
    return res.status(500).json({ message: 'Server error fetching complaint timeline.' });
  }
};

// ===========================================================================
// GET /api/complaints
// ADMIN only — platform-wide complaints oversight.
// Query filters: ?search=, ?status=, ?departmentId=
// ===========================================================================
export const getAllComplaints = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.departmentId) {
      filter.department = req.query.departmentId;
    }

    if (req.query.search) {
      const term = req.query.search.trim();
      filter.$or = [
        { reference: { $regex: term, $options: 'i' } },
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    const complaints = await populateComplaint(
      Complaint.find(filter).sort({ createdAt: -1 })
    ).lean();

    return res.status(200).json({ complaints });
  } catch (err) {
    console.error('getAllComplaints error:', err.message);
    return res.status(500).json({ message: 'Server error fetching all complaints.' });
  }
};

// ===========================================================================
// PUT /api/complaints/:id/assign
// ADMIN only — assign or reassign complaint to eligible staff member.
// Rules:
//   - Selected user must exist and have role === 'STAFF'.
//   - Selected staff member must belong to the complaint's department.
//   - Adds an ASSIGNED history event.
//   - Dispatches in-app notification to the newly assigned staff member.
// ===========================================================================
export const assignComplaintStaff = async (req, res) => {
  try {
    const targetStaffId = req.body.staffId || req.body.assignedStaff;
    if (!targetStaffId) {
      return res.status(400).json({ message: 'Staff ID is required for assignment.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    let staff;
    try {
      staff = await User.findById(targetStaffId);
    } catch {
      return res.status(400).json({ message: 'Invalid staff ID format.' });
    }

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    if (staff.role !== 'STAFF') {
      return res.status(400).json({ message: 'Complaints can only be assigned to users with role STAFF.' });
    }

    // Check staff belongs to the complaint's department
    if (!staff.department || staff.department.toString() !== complaint.department.toString()) {
      return res.status(400).json({
        message: "Staff member does not belong to this complaint's department.",
      });
    }

    complaint.assignedStaff = staff._id;
    if (complaint.status === 'PENDING') {
      complaint.status = 'ASSIGNED';
    }

    complaint.history.push({
      eventType: 'ASSIGNED',
      description: `Complaint assigned to ${staff.name} (${staff.email}) by ${req.user.name}.`,
      performedBy: req.user.id,
      performedByName: req.user.name,
      eventAt: new Date(),
    });

    complaint.updatedAt = new Date();
    await complaint.save();

    // In-app notification for the newly assigned staff member
    await createNotification(
      staff._id,
      `You have been assigned complaint ${complaint.reference}: "${complaint.title}".`,
      complaint._id
    );

    const populated = await populateComplaint(
      Complaint.findById(complaint._id)
    ).lean();

    return res.status(200).json({
      message: 'Complaint assigned successfully.',
      complaint: populated,
    });
  } catch (err) {
    console.error('assignComplaintStaff error:', err.message);
    return res.status(500).json({ message: 'Server error assigning complaint staff.' });
  }
};

