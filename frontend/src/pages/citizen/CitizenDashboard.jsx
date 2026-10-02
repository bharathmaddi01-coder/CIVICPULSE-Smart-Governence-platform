// src/pages/citizen/CitizenDashboard.jsx
// Citizen Dashboard: stat cards + recent complaints + quick report tab.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import ComplaintForm from '../../components/citizen/ComplaintForm.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import api from '../../services/api.js';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/dashboard/citizen');
        setStats(res.data);
      } catch (err) {
        console.error('Citizen dashboard error:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [refreshTrigger]);

  const handleComplaintCreated = () => {
    setRefreshTrigger((p) => p + 1);
    setActiveTab('dashboard');
  };

  const StatCard = ({ label, value, color }) => (
    <div className="col-6 col-md-3">
      <div className="stat-card h-100">
        <div className={`stat-value ${color}`}>{value ?? 0}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="container py-4">
      {/* Welcome Banner */}
      <div className="civic-card p-3 mb-4 border-start border-4 border-success">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <span className="civic-badge mb-1">Citizen Portal</span>
            <h5 className="fw-bold mb-0 mt-1">Welcome, {user?.name || 'Citizen'}</h5>
            <small className="text-muted">{user?.email} &bull; Municipal Grievance Redressal System</small>
          </div>
          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-semibold">
            CITIZEN
          </span>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills civic-tabs gap-2 bg-light p-2 rounded mb-4">
        <li className="nav-item flex-fill text-center">
          <button
            className={`nav-link w-100 py-2 fw-semibold ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 My Dashboard
          </button>
        </li>
        <li className="nav-item flex-fill text-center">
          <button
            className={`nav-link w-100 py-2 fw-semibold ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            📝 Report New Issue
          </button>
        </li>
        <li className="nav-item flex-fill text-center">
          <Link
            to="/citizen/complaints"
            className="nav-link w-100 py-2 fw-semibold text-dark"
          >
            📋 All My Complaints
          </Link>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === 'report' && (
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <ComplaintForm onComplaintCreated={handleComplaintCreated} />
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <>
          {error && (
            <div className="alert alert-danger py-2 small">{error}</div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status" />
              <p className="text-muted mt-2 small">Loading dashboard…</p>
            </div>
          ) : stats ? (
            <>
              {/* Stat Cards */}
              <div className="row g-3 mb-4">
                <StatCard label="Total Submitted" value={stats.total} color="text-dark" />
                <StatCard label="Pending / Assigned" value={(stats.pending || 0) + (stats.assigned || 0)} color="text-warning" />
                <StatCard label="In Progress" value={stats.inProgress} color="text-primary" />
                <StatCard label="Resolved / Closed" value={(stats.resolved || 0) + (stats.closed || 0)} color="text-success" />
              </div>

              {/* Recent Complaints */}
              <div className="section-card">
                <div className="section-card-header justify-content-between">
                  <span>📋 Recent Complaints</span>
                  <Link to="/citizen/complaints" className="btn btn-outline-success btn-sm">
                    View All
                  </Link>
                </div>

                {(!stats.recent || stats.recent.length === 0) ? (
                  <div className="text-center py-5 text-muted">
                    <span className="fs-2 d-block mb-2">📬</span>
                    <p className="mb-1">No complaints submitted yet.</p>
                    <button className="btn btn-success btn-sm" onClick={() => setActiveTab('report')}>
                      Report Your First Issue
                    </button>
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Ref #</th>
                          <th>Title</th>
                          <th>Department</th>
                          <th>Status</th>
                          <th>Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recent.map((c) => (
                          <tr key={c._id}>
                            <td>
                              <code className="text-success">{c.reference}</code>
                            </td>
                            <td className="fw-semibold">{c.title}</td>
                            <td className="text-muted small">{c.department?.name || '—'}</td>
                            <td><StatusBadge status={c.status} /></td>
                            <td className="text-muted small">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Quick help */}
              <div className="alert alert-light border small mt-3">
                <strong>📌 Tip:</strong> After a complaint is marked <em>Resolved</em>, you can visit{' '}
                <Link to="/citizen/complaints" className="text-success fw-semibold">My Complaints</Link> to
                accept the resolution (closes it) or reopen it if the issue persists.
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
};

export default CitizenDashboard;
