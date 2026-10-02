// src/pages/citizen/CitizenComplaintsPage.jsx
// Full citizen complaints list with detail modal + resolution verification.

import { useState, useEffect } from 'react';
import api from '../../services/api.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Timeline from '../../components/common/Timeline.jsx';

export const CitizenComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Detail modal state
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Verification form state
  const [verifying, setVerifying] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await api.get('/complaints/my', { params });
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load complaints. Please try again.');
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
    setDetailError('');
    setVerifyError('');
    setVerifySuccess('');
    setReopenReason('');
    // Fetch full complaint with history
    try {
      setDetailLoading(true);
      const res = await api.get(`/complaints/${complaint._id}`);
      setSelected(res.data.complaint);
    } catch (err) {
      setDetailError('Failed to load complaint details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setVerifyError('');
    setVerifySuccess('');
    setReopenReason('');
  };

  const handleVerify = async (accepted) => {
    if (!accepted && (!reopenReason.trim() || reopenReason.trim().length < 5)) {
      setVerifyError('Please provide a reopen reason of at least 5 characters.');
      return;
    }
    try {
      setVerifying(true);
      setVerifyError('');
      const payload = accepted ? { accepted: true } : { accepted: false, reason: reopenReason.trim() };
      const res = await api.post(`/complaints/${selected._id}/verify`, payload);
      setVerifySuccess(res.data.message);
      setSelected(res.data.complaint);
      fetchComplaints();
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-bold mb-0">My Complaints</h4>
          <small className="text-muted">Real-time status updates and department handling</small>
        </div>
        <button className="btn btn-outline-success btn-sm" onClick={fetchComplaints} disabled={loading}>
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
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved (Action Required)</option>
                <option value="REOPENED">Reopened</option>
                <option value="CLOSED">Closed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {/* Complaints Table */}
      <div className="section-card">
        <div className="section-card-header">📋 Submitted Complaints ({complaints.length})</div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success spinner-border-sm" role="status" />
            <span className="ms-2 text-muted small">Loading…</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <span className="fs-2 d-block mb-2">📬</span>
            <p>{searchTerm || statusFilter ? 'No complaints match your search criteria.' : 'No complaints submitted yet.'}</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Ref #</th>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id}>
                    <td><code className="text-success">{c.reference}</code></td>
                    <td className="fw-semibold">{c.title}</td>
                    <td className="text-muted small">{c.department?.name || '—'}</td>
                    <td className="text-muted small">{c.category}</td>
                    <td>
                      <StatusBadge status={c.status} />
                      {c.status === 'RESOLVED' && (
                        <span className="ms-1 badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>Action needed</span>
                      )}
                    </td>
                    <td className="text-muted small">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-outline-success btn-sm"
                        onClick={() => openDetail(c)}
                      >
                        View
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
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-box-header">
              <div>
                <code className="text-success me-2">{selected.reference}</code>
                <StatusBadge status={selected.status} />
              </div>
              <button className="btn-close" onClick={closeDetail} />
            </div>

            <div className="modal-box-body">
              {detailLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-success spinner-border-sm" role="status" />
                </div>
              ) : detailError ? (
                <div className="alert alert-danger small">{detailError}</div>
              ) : (
                <>
                  <h5 className="fw-bold mb-3">{selected.title}</h5>

                  <div className="row g-2 mb-3">
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
                      <small className="text-muted d-block">Assigned Staff</small>
                      <strong>{selected.assignedStaff?.name || 'Not yet assigned'}</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted d-block mb-1">Description</small>
                    <p className="small mb-0 border rounded p-2 bg-light">{selected.description}</p>
                  </div>

                  {selected.resolution && (
                    <div className="alert alert-success small p-2 mb-3">
                      <strong>✅ Resolution:</strong> {selected.resolution}
                    </div>
                  )}

                  {selected.remarks && (
                    <div className="alert alert-secondary small p-2 mb-3">
                      <strong>💬 Staff Remarks:</strong> {selected.remarks}
                    </div>
                  )}

                  {selected.reopenReason && (
                    <div className="alert alert-warning small p-2 mb-3">
                      <strong>🔁 Reopen Reason:</strong> {selected.reopenReason}
                    </div>
                  )}

                  {/* Photo Evidence */}
                  {selected.photoData && (
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">Photo Evidence</small>
                      <img
                        src={selected.photoData}
                        alt="Complaint evidence"
                        className="img-thumbnail"
                        style={{ maxHeight: '150px' }}
                      />
                    </div>
                  )}

                  {/* Verification Panel — only for RESOLVED complaints */}
                  {selected.status === 'RESOLVED' && (
                    <div className="border rounded p-3 bg-light mb-3">
                      <h6 className="fw-semibold mb-2">🔎 Verify Resolution</h6>
                      <p className="small text-muted mb-3">
                        The staff has marked this complaint as resolved. Please verify if the issue has been fixed.
                      </p>

                      {verifySuccess ? (
                        <div className="alert alert-success small p-2">{verifySuccess}</div>
                      ) : (
                        <>
                          {verifyError && (
                            <div className="alert alert-danger small p-2">{verifyError}</div>
                          )}
                          <div className="mb-3">
                            <label className="form-label small fw-semibold">
                              Reopen reason (required if rejecting):
                            </label>
                            <textarea
                              className="form-control form-control-sm"
                              rows={2}
                              placeholder="Describe why the issue is not resolved (min 5 chars)..."
                              value={reopenReason}
                              onChange={(e) => setReopenReason(e.target.value)}
                              disabled={verifying}
                            />
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleVerify(true)}
                              disabled={verifying}
                            >
                              {verifying ? '…' : '✅ Accept & Close'}
                            </button>
                            <button
                              className="btn btn-outline-warning btn-sm"
                              onClick={() => handleVerify(false)}
                              disabled={verifying}
                            >
                              {verifying ? '…' : '🔁 Reopen — Not Fixed'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <h6 className="fw-semibold mb-2">📅 Complaint Timeline</h6>
                    <Timeline history={selected.history} />
                  </div>
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

export default CitizenComplaintsPage;
