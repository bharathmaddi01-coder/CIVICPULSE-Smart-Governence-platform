// src/pages/admin/AllComplaints.jsx
// Admin: platform-wide complaints table with search/dept/status filter + detail modal + delete + assign.

import { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Timeline from '../../components/common/Timeline.jsx';
import api from '../../services/api.js';

export const AllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Detail modal
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('detail');

  // Assign staff
  const [staffList, setStaffList] = useState([]);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState('');
  const [assignError, setAssignError] = useState('');

  // Delete
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (deptFilter) params.departmentId = deptFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await api.get('/complaints', { params });
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    api.get('/departments').then((r) => setDepartments(r.data.departments || [])).catch(() => {});
  }, [statusFilter, deptFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  const openDetail = async (complaint) => {
    setSelected(complaint);
    setActiveSection('detail');
    setAssignStaffId('');
    setAssignMsg('');
    setAssignError('');
    setDeleteError('');
    try {
      setDetailLoading(true);
      const [detailRes, staffRes] = await Promise.all([
        api.get(`/complaints/${complaint._id}`),
        api.get('/users', { params: { role: 'STAFF' } }),
      ]);
      setSelected(detailRes.data.complaint);
      setStaffList(staffRes.data.users || []);
    } catch (err) {
      console.error('Admin detail fetch error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setAssignMsg('');
    setAssignError('');
    setDeleteError('');
  };

  const handleAssign = async () => {
    if (!assignStaffId) {
      setAssignError('Please select a staff member.');
      return;
    }
    try {
      setAssigning(true);
      setAssignError('');
      const res = await api.put(`/complaints/${selected._id}/assign`, { staffId: assignStaffId });
      setAssignMsg(`Assigned to ${res.data.complaint.assignedStaff?.name} successfully.`);
      setSelected(res.data.complaint);
      fetchComplaints();
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete complaint ${selected.reference}? This cannot be undone.`)) return;
    try {
      setDeleting(true);
      setDeleteError('');
      await api.delete(`/complaints/${selected._id}`);
      fetchComplaints();
      closeDetail();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Delete failed.');
      setDeleting(false);
    }
  };

  // Filter staff for the selected complaint's department
  const eligibleStaff = selected
    ? staffList.filter((s) => {
        const sDept = s.department?._id || s.department;
        const cDept = selected.department?._id || selected.department;
        return sDept && cDept && sDept.toString() === cDept.toString();
      })
    : [];

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-bold mb-0">All Complaints</h4>
          <small className="text-muted">Platform-wide oversight — search, filter, assign, and delete</small>
        </div>
        <button className="btn btn-outline-danger btn-sm" onClick={fetchComplaints} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="section-card mb-4">
        <div className="section-card-header">🔍 Search & Filter</div>
        <div className="p-3">
          <div className="row g-2">
            <div className="col-md-5">
              <form onSubmit={handleSearch} className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by ref, title, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-secondary" type="submit">Search</button>
              </form>
            </div>
            <div className="col-md-4">
              <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REOPENED">Reopened</option>
                <option value="CLOSED">Closed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger small py-2">{error}</div>}

      {/* Table */}
      <div className="section-card">
        <div className="section-card-header">📋 Complaints ({complaints.length})</div>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger spinner-border-sm" role="status" />
            <span className="ms-2 text-muted small">Loading…</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p>No complaints match the current filter.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Ref #</th>
                  <th>Title</th>
                  <th>Citizen</th>
                  <th>Department</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id}>
                    <td><code className="text-danger">{c.reference}</code></td>
                    <td className="fw-semibold">{c.title}</td>
                    <td className="text-muted small">{c.citizen?.name || '—'}</td>
                    <td className="text-muted small">{c.department?.name || '—'}</td>
                    <td className="text-muted small">{c.assignedStaff?.name || <span className="text-warning">Unassigned</span>}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="text-muted small">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => openDetail(c)}>
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-box" style={{ maxWidth: '760px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-box-header">
              <div>
                <code className="text-danger me-2">{selected.reference}</code>
                <StatusBadge status={selected.status} />
              </div>
              <button className="btn-close" onClick={closeDetail} />
            </div>

            {/* Sub-tabs */}
            <div className="px-3 pt-3 pb-0 border-bottom d-flex gap-2 flex-wrap">
              {['detail', 'assign', 'timeline'].map((sec) => (
                <button
                  key={sec}
                  className={`btn btn-sm mb-2 ${activeSection === sec ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => { setActiveSection(sec); setAssignMsg(''); setAssignError(''); setDeleteError(''); }}
                >
                  {sec === 'detail' ? '📄 Details' : sec === 'assign' ? '👤 Assign Staff' : '📅 Timeline'}
                </button>
              ))}
            </div>

            <div className="modal-box-body">
              {detailLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-danger spinner-border-sm" role="status" />
                </div>
              ) : (
                <>
                  {/* Details */}
                  {activeSection === 'detail' && (
                    <>
                      <h5 className="fw-bold mb-3">{selected.title}</h5>
                      <div className="row g-2 mb-3">
                        <div className="col-sm-4">
                          <small className="text-muted d-block">Citizen</small>
                          <strong>{selected.citizen?.name || '—'}</strong>
                          <small className="text-muted d-block">{selected.citizen?.email}</small>
                        </div>
                        <div className="col-sm-4">
                          <small className="text-muted d-block">Department</small>
                          <strong>{selected.department?.name || '—'}</strong>
                        </div>
                        <div className="col-sm-4">
                          <small className="text-muted d-block">Assigned Staff</small>
                          <strong>{selected.assignedStaff?.name || 'None'}</strong>
                          <small className="text-muted d-block">{selected.assignedStaff?.email}</small>
                        </div>
                        <div className="col-sm-4">
                          <small className="text-muted d-block">Category</small>
                          <strong>{selected.category}</strong>
                        </div>
                        <div className="col-sm-4">
                          <small className="text-muted d-block">Location</small>
                          <strong>{selected.location}</strong>
                        </div>
                        <div className="col-sm-4">
                          <small className="text-muted d-block">GPS</small>
                          <span className="small">{selected.latitude?.toFixed(4)}, {selected.longitude?.toFixed(4)}</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">Description</small>
                        <p className="small mb-0 border rounded p-2 bg-light">{selected.description}</p>
                      </div>

                      {selected.resolution && (
                        <div className="alert alert-success small p-2 mb-2">
                          <strong>✅ Resolution:</strong> {selected.resolution}
                        </div>
                      )}
                      {selected.remarks && (
                        <div className="alert alert-secondary small p-2 mb-2">
                          <strong>💬 Remarks:</strong> {selected.remarks}
                        </div>
                      )}
                      {selected.reopenReason && (
                        <div className="alert alert-warning small p-2 mb-2">
                          <strong>🔁 Reopen Reason:</strong> {selected.reopenReason}
                        </div>
                      )}
                      {selected.photoData && (
                        <div className="mb-2">
                          <small className="text-muted d-block mb-1">Photo Evidence</small>
                          <img src={selected.photoData} alt="Evidence" className="img-thumbnail" style={{ maxHeight: '130px' }} />
                        </div>
                      )}

                      {deleteError && (
                        <div className="alert alert-danger small p-2 mt-2">{deleteError}</div>
                      )}
                      <div className="mt-3">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={handleDelete}
                          disabled={deleting}
                        >
                          {deleting ? 'Deleting…' : '🗑 Permanently Delete Complaint'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Assign Staff */}
                  {activeSection === 'assign' && (
                    <>
                      <h6 className="fw-semibold mb-1">Assign / Reassign Staff</h6>
                      <p className="text-muted small mb-3">
                        Department: <strong>{selected.department?.name}</strong> &bull;
                        Current: <strong>{selected.assignedStaff?.name || 'None'}</strong>
                      </p>

                      {assignMsg && <div className="alert alert-success small p-2 mb-3">{assignMsg}</div>}
                      {assignError && <div className="alert alert-danger small p-2 mb-3">{assignError}</div>}

                      {eligibleStaff.length === 0 ? (
                        <div className="alert alert-warning small">
                          No staff found in the <strong>{selected.department?.name}</strong> department.
                          Use the <a href="/admin/users" className="alert-link">Users panel</a> to add staff members.
                        </div>
                      ) : (
                        <>
                          <div className="mb-3">
                            <label className="form-label small fw-semibold">Select Staff Member</label>
                            <select
                              className="form-select form-select-sm"
                              value={assignStaffId}
                              onChange={(e) => setAssignStaffId(e.target.value)}
                            >
                              <option value="">— Choose staff —</option>
                              {eligibleStaff.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.email})
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={handleAssign}
                            disabled={assigning}
                          >
                            {assigning ? 'Assigning…' : 'Assign Staff'}
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {/* Timeline */}
                  {activeSection === 'timeline' && (
                    <>
                      <h6 className="fw-semibold mb-3">📅 Complaint Timeline</h6>
                      <Timeline history={selected.history} />
                    </>
                  )}
                </>
              )}
            </div>

            <div className="modal-box-footer">
              <button className="btn btn-secondary btn-sm" onClick={closeDetail}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllComplaints;
