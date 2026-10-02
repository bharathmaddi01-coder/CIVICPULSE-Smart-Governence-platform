// src/pages/staff/AssignedComplaints.jsx
// Staff: full work queue with search/filter + inline status update modal.

import { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Timeline from '../../components/common/Timeline.jsx';
import api from '../../services/api.js';

export const AssignedComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Detail/update modal
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('detail'); // 'detail' | 'update' | 'timeline'

  // Update form
  const [updateForm, setUpdateForm] = useState({ status: '', remarks: '', resolution: '' });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await api.get('/complaints/assigned', { params });
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load assigned complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  const openDetail = async (complaint) => {
    setSelected(complaint);
    setActiveSection('detail');
    setUpdateForm({ status: '', remarks: '', resolution: '' });
    setUpdateError('');
    setUpdateSuccess('');
    try {
      setDetailLoading(true);
      const res = await api.get(`/complaints/${complaint._id}`);
      setSelected(res.data.complaint);
    } catch (err) {
      console.error('Detail fetch error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setUpdateError('');
    setUpdateSuccess('');
  };

  // Valid next statuses for current status
  const allowedNextStatuses = (currentStatus) => {
    const map = {
      ASSIGNED:    ['IN_PROGRESS'],
      REOPENED:    ['IN_PROGRESS'],
      IN_PROGRESS: ['RESOLVED', 'REJECTED'],
    };
    return map[currentStatus] || [];
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');

    if (!updateForm.status) {
      setUpdateError('Please select a new status.');
      return;
    }
    if (updateForm.status === 'RESOLVED' && !updateForm.resolution.trim()) {
      setUpdateError('A resolution note is required to resolve a complaint.');
      return;
    }
    if (updateForm.status === 'REJECTED' && !updateForm.remarks.trim()) {
      setUpdateError('Remarks are required to reject a complaint.');
      return;
    }

    try {
      setUpdating(true);
      const payload = {
        status: updateForm.status,
        ...(updateForm.remarks.trim() && { remarks: updateForm.remarks.trim() }),
        ...(updateForm.resolution.trim() && { resolution: updateForm.resolution.trim() }),
      };
      const res = await api.put(`/complaints/${selected._id}`, payload);
      setUpdateSuccess(`Complaint updated to ${res.data.complaint.status} successfully.`);
      setSelected(res.data.complaint);
      setActiveSection('detail');
      fetchComplaints();
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-bold mb-0">Assigned Complaints</h4>
          <small className="text-muted">Your active work queue — update status, add remarks, and resolve complaints</small>
        </div>
        <button className="btn btn-outline-primary btn-sm" onClick={fetchComplaints} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="section-card mb-4">
        <div className="section-card-header">🔍 Search & Filter</div>
        <div className="p-3">
          <div className="row g-2">
            <div className="col-md-7">
              <form onSubmit={handleSearch} className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-secondary" type="submit">Search</button>
              </form>
            </div>
            <div className="col-md-5">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REOPENED">Reopened</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger small py-2">{error}</div>}

      {/* Complaints Table */}
      <div className="section-card">
        <div className="section-card-header">📋 Work Queue ({complaints.length})</div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm" role="status" />
            <span className="ms-2 text-muted small">Loading…</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <span className="fs-2 d-block mb-2">🎉</span>
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
                  <th>Category</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => {
                  const daysSince = Math.floor((Date.now() - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
                  const isOverdue = !['RESOLVED', 'CLOSED', 'REJECTED'].includes(c.status) && daysSince > 7;
                  return (
                    <tr key={c._id} className={isOverdue ? 'table-warning' : ''}>
                      <td>
                        <code className="text-primary">{c.reference}</code>
                        {isOverdue && <span className="ms-1 badge bg-danger" style={{ fontSize: '0.65rem' }}>Overdue</span>}
                      </td>
                      <td className="fw-semibold">{c.title}</td>
                      <td className="text-muted small">{c.citizen?.name || '—'}</td>
                      <td className="text-muted small">{c.category}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="text-muted small">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => openDetail(c)}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail/Update Modal */}
      {selected && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-box" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-box-header">
              <div>
                <code className="text-primary me-2">{selected.reference}</code>
                <StatusBadge status={selected.status} />
              </div>
              <button className="btn-close" onClick={closeDetail} />
            </div>

            {/* Modal sub-tabs */}
            <div className="px-3 pt-3 pb-0 border-bottom d-flex gap-2">
              {['detail', 'update', 'timeline'].map((sec) => (
                <button
                  key={sec}
                  className={`btn btn-sm mb-2 ${activeSection === sec ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => { setActiveSection(sec); setUpdateError(''); setUpdateSuccess(''); }}
                >
                  {sec === 'detail' ? '📄 Details' : sec === 'update' ? '✏️ Update Status' : '📅 Timeline'}
                </button>
              ))}
            </div>

            <div className="modal-box-body">
              {detailLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary spinner-border-sm" role="status" />
                </div>
              ) : (
                <>
                  {/* Details Section */}
                  {activeSection === 'detail' && (
                    <>
                      {updateSuccess && (
                        <div className="alert alert-success small p-2 mb-3">{updateSuccess}</div>
                      )}
                      <h5 className="fw-bold mb-3">{selected.title}</h5>
                      <div className="row g-2 mb-3">
                        <div className="col-sm-6">
                          <small className="text-muted d-block">Citizen</small>
                          <strong>{selected.citizen?.name || '—'}</strong>
                          <small className="text-muted d-block">{selected.citizen?.email}</small>
                        </div>
                        <div className="col-sm-6">
                          <small className="text-muted d-block">Department</small>
                          <strong>{selected.department?.name || '—'}</strong>
                        </div>
                        <div className="col-sm-6">
                          <small className="text-muted d-block">Category</small>
                          <strong>{selected.category}</strong>
                        </div>
                        <div className="col-sm-6">
                          <small className="text-muted d-block">Location</small>
                          <strong>{selected.location}</strong>
                        </div>
                        <div className="col-sm-6">
                          <small className="text-muted d-block">GPS</small>
                          <span className="small">{selected.latitude?.toFixed(4)}, {selected.longitude?.toFixed(4)}</span>
                        </div>
                        <div className="col-sm-6">
                          <small className="text-muted d-block">Submitted</small>
                          <span className="small">{new Date(selected.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">Description</small>
                        <p className="small mb-0 border rounded p-2 bg-light">{selected.description}</p>
                      </div>

                      {selected.photoData && (
                        <div className="mb-3">
                          <small className="text-muted d-block mb-1">Photo Evidence</small>
                          <img src={selected.photoData} alt="Evidence" className="img-thumbnail" style={{ maxHeight: '150px' }} />
                        </div>
                      )}

                      {selected.remarks && (
                        <div className="alert alert-secondary small p-2 mb-2">
                          <strong>💬 Remarks:</strong> {selected.remarks}
                        </div>
                      )}
                      {selected.resolution && (
                        <div className="alert alert-success small p-2 mb-2">
                          <strong>✅ Resolution:</strong> {selected.resolution}
                        </div>
                      )}

                      {allowedNextStatuses(selected.status).length > 0 && (
                        <button
                          className="btn btn-primary btn-sm mt-2"
                          onClick={() => setActiveSection('update')}
                        >
                          ✏️ Update Status →
                        </button>
                      )}
                    </>
                  )}

                  {/* Update Status Section */}
                  {activeSection === 'update' && (
                    <form onSubmit={handleUpdate}>
                      <h6 className="fw-semibold mb-1">{selected.title}</h6>
                      <p className="text-muted small mb-3">
                        Current status: <StatusBadge status={selected.status} />
                      </p>

                      {updateError && (
                        <div className="alert alert-danger small p-2 mb-3">{updateError}</div>
                      )}
                      {updateSuccess && (
                        <div className="alert alert-success small p-2 mb-3">{updateSuccess}</div>
                      )}

                      <div className="mb-3">
                        <label className="form-label small fw-semibold">
                          New Status <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={updateForm.status}
                          onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                          required
                        >
                          <option value="">— Select new status —</option>
                          {allowedNextStatuses(selected.status).map((s) => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                        <small className="text-muted">
                          Allowed: {allowedNextStatuses(selected.status).join(', ') || 'No further transitions available'}
                        </small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold">
                          Staff Remarks {updateForm.status === 'REJECTED' && <span className="text-danger">*</span>}
                        </label>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          placeholder="Internal notes or reason for status change..."
                          value={updateForm.remarks}
                          onChange={(e) => setUpdateForm({ ...updateForm, remarks: e.target.value })}
                          disabled={updating}
                        />
                      </div>

                      {updateForm.status === 'RESOLVED' && (
                        <div className="mb-3">
                          <label className="form-label small fw-semibold">
                            Resolution Note <span className="text-danger">*</span>
                          </label>
                          <textarea
                            className="form-control form-control-sm"
                            rows={3}
                            placeholder="Describe exactly what was done to resolve this issue..."
                            value={updateForm.resolution}
                            onChange={(e) => setUpdateForm({ ...updateForm, resolution: e.target.value })}
                            disabled={updating}
                            required
                          />
                          <small className="text-muted">Required. The citizen will see this resolution note.</small>
                        </div>
                      )}

                      <button type="submit" className="btn btn-primary btn-sm" disabled={updating}>
                        {updating ? (
                          <><span className="spinner-border spinner-border-sm me-1" />Updating…</>
                        ) : (
                          'Submit Update'
                        )}
                      </button>
                    </form>
                  )}

                  {/* Timeline Section */}
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

export default AssignedComplaints;
