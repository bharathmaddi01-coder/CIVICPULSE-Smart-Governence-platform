// src/controllers/dashboardController.js
// Dashboard metrics and recent activity controller.
// Route → Controller → Model (no service/repository layer).

import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

// ===========================================================================
// GET /api/dashboard/citizen
// CITIZEN only — personal complaint metrics and recent 4 complaints.
// ===========================================================================
export const getCitizenDashboard = async (req, res) => {
  try {
    const list = await Complaint.find({ citizen: req.user.id })
      .populate('department', 'name description')
      .populate('assignedStaff', 'name email')
      .lean();

    const total = list.length;
    let pending = 0;
    let assigned = 0;
    let inProgress = 0;
    let resolved = 0;
    let closed = 0;
    let rejected = 0;

    for (const c of list) {
      if (c.status === 'PENDING') pending++;
      else if (c.status === 'ASSIGNED') assigned++;
      else if (c.status === 'IN_PROGRESS') inProgress++;
      else if (c.status === 'RESOLVED') resolved++;
      else if (c.status === 'CLOSED') closed++;
      else if (c.status === 'REJECTED') rejected++;
    }

    // Recent 4 complaints sorted by updatedAt desc
    const sorted = [...list].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
    const recent = sorted.slice(0, 4);

    return res.status(200).json({
      total,
      pending,
      assigned,
      inProgress,
      resolved,
      closed,
      rejected,
      recent,
    });
  } catch (err) {
    console.error('getCitizenDashboard error:', err.message);
    return res.status(500).json({ message: 'Server error generating citizen dashboard.' });
  }
};

// ===========================================================================
// GET /api/dashboard/staff
// STAFF only — personal workload metrics, overdue count, and recent 4 complaints.
// Overdue = status NOT IN ['RESOLVED', 'CLOSED', 'REJECTED'] AND createdAt < now - 7 days.
// ===========================================================================
export const getStaffDashboard = async (req, res) => {
  try {
    const list = await Complaint.find({ assignedStaff: req.user.id })
      .populate('citizen', 'name email')
      .populate('department', 'name description')
      .lean();

    const assigned = list.length;
    let inProgress = 0;
    let resolved = 0;
    let closed = 0;
    let rejected = 0;
    let overdue = 0;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const completedStatuses = ['RESOLVED', 'CLOSED', 'REJECTED'];

    for (const c of list) {
      if (c.status === 'IN_PROGRESS') inProgress++;
      else if (c.status === 'RESOLVED') resolved++;
      else if (c.status === 'CLOSED') closed++;
      else if (c.status === 'REJECTED') rejected++;

      if (!completedStatuses.includes(c.status)) {
        const cTime = new Date(c.createdAt).getTime();
        if (cTime < sevenDaysAgo) {
          overdue++;
        }
      }
    }

    // Recent 4 complaints sorted by updatedAt desc
    const sorted = [...list].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
    const recent = sorted.slice(0, 4);

    return res.status(200).json({
      assigned,
      inProgress,
      resolved,
      closed,
      rejected,
      overdue,
      recent,
    });
  } catch (err) {
    console.error('getStaffDashboard error:', err.message);
    return res.status(500).json({ message: 'Server error generating staff dashboard.' });
  }
};

// ===========================================================================
// GET /api/dashboard/admin
// ADMIN only — platform-wide metrics, department breakdown, and recent complaints.
// ===========================================================================
export const getAdminDashboard = async (req, res) => {
  try {
    const [totalUsers, totalCitizens, totalStaff, activeDepartments, allComplaints] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'CITIZEN' }),
        User.countDocuments({ role: 'STAFF' }),
        Department.find({ active: true }).lean(),
        Complaint.find()
          .populate('citizen', 'name email')
          .populate('department', 'name description')
          .populate('assignedStaff', 'name email')
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    const totalComplaints = allComplaints.length;
    let resolvedComplaints = 0;

    const statusBreakdown = {
      PENDING: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      REOPENED: 0,
      CLOSED: 0,
      REJECTED: 0,
    };

    const deptCounts = {};
    for (const d of activeDepartments) {
      deptCounts[d._id.toString()] = {
        department: d.name,
        count: 0,
      };
    }

    for (const c of allComplaints) {
      if (statusBreakdown[c.status] !== undefined) {
        statusBreakdown[c.status]++;
      }
      if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
        resolvedComplaints++;
      }

      if (c.department && c.department._id) {
        const dId = c.department._id.toString();
        if (deptCounts[dId]) {
          deptCounts[dId].count++;
        }
      }
    }

    const departmentBreakdown = Object.values(deptCounts).sort((a, b) => b.count - a.count);
    const recent = allComplaints.slice(0, 5);

    return res.status(200).json({
      totalUsers,
      totalCitizens,
      totalStaff,
      totalComplaints,
      resolvedComplaints,
      departments: activeDepartments.length,
      statusBreakdown,
      departmentBreakdown,
      recent,
    });
  } catch (err) {
    console.error('getAdminDashboard error:', err.message);
    return res.status(500).json({ message: 'Server error generating admin dashboard.' });
  }
};
