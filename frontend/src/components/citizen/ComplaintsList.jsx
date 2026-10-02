// src/components/citizen/ComplaintsList.jsx
// Displays complaints submitted by the authenticated citizen.

import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export const ComplaintsList = ({ refreshTrigger }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
      console.error('Failed to fetch citizen complaints:', err);
      setError('Failed to load your complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [refreshTrigger, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge bg-warning text-dark">Pending Review</span>;
      case 'IN_PROGRESS':
        return <span className="badge bg-primary">In Progress</span>;
      case 'RESOLVED':
        return <span className="badge bg-success">Resolved</span>;
      case 'CLOSED':
        return <span className="badge bg-secondary">Closed</span>;
      case 'REJECTED':
        return <span className="badge bg-danger">Rejected</span>;
      default:
        return <span className="badge bg-light text-dark border">{status}</span>;
    }
  };

  return (
    <div className="card civic-card shadow-sm">
      <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
            <span className="me-2">📋</span> My Submitted Complaints
          </h5>
          <small className="text-muted">Track status, department handling, and resolutions</small>
        </div>
        <button
          type="button"
          className="btn btn-outline-success btn-sm"
          onClick={fetchComplaints}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh List'}
        </button>
      </div>

      <div className="card-body p-3">
        {/* Search & Filter Controls */}
        <div className="row g-2 mb-3">
          <div className="col-md-7">
            <form onSubmit={handleSearch} className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Search complaints by title or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-outline-secondary" type="submit">
                Search
              </button>
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
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success spinner-border-sm me-2" role="status"></div>
            <span className="text-muted small">Loading complaints...</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-5 bg-light rounded border border-dashed">
            <span className="fs-1 d-block mb-2">📬</span>
            <h6 className="fw-semibold text-muted">No complaints found</h6>
            <p className="text-muted small mb-0">
              {searchTerm || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'You have not registered any civic complaints yet. Use the form above to submit your first issue!'}
            </p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {complaints.map((item) => (
              <div key={item._id} className="list-group-item px-2 py-3 border-bottom">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-1">
                  <div>
                    <span className="badge bg-light text-success border border-success-subtle font-monospace me-2">
                      {item.reference}
                    </span>
                    <strong className="text-dark">{item.title}</strong>
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                <p className="text-muted small mb-2">{item.description}</p>

                <div className="d-flex flex-wrap gap-3 text-muted small" style={{ fontSize: '0.8rem' }}>
                  <span>
                    🏢 <strong>Dept:</strong> {item.department?.name || 'Department'}
                  </span>
                  <span>
                    🏷️ <strong>Category:</strong> {item.category}
                  </span>
                  <span>
                    📍 <strong>Location:</strong> {item.location}
                  </span>
                  <span>
                    📅 <strong>Submitted:</strong> {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintsList;
