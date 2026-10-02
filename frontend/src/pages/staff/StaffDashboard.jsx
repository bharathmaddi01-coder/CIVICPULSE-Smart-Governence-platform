// src/pages/staff/StaffDashboard.jsx
// Staff Dashboard: workload stats from /api/dashboard/staff + recent queue.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import api from '../../services/api.js';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const deptName = user?.department?.name || 'Municipal Department';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/dashboard/staff');
        setStats(res.data);
      } catch (err) {
        console.error('Staff dashboard error:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const StatCard = ({ label, value, color, bg }) => (
    <div className="col-6 col-md-3">
      <div className={`stat-card h-100 ${bg || ''}`}>
        <div className={`stat-value ${color || 'text-dark'}`}>{value ?? 0}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="container py-4">
      {/* Welcome Banner */}
      <div className="civic-card p-3 mb-4 border-start border-4 border-primary">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <span className="civic-badge mb-1" style={{ background: '#cfe2ff', color: '#084298' }}>Staff Portal</span>
            <h5 className="fw-bold mb-0 mt-1">{deptName} — Staff Dashboard</h5>
            <small className="text-muted">{user?.name} &bull; {user?.email}</small>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fw-semibold">
            STAFF
          </span>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2 small">Loading dashboard…</p>
        </div>
      ) : stats && (
        <>
          {/* Stat Cards */}
          <div className="row g-3 mb-4">
            <StatCard label="Total Assigned" value={stats.assigned} color="text-dark" />
            <StatCard label="In Progress" value={stats.inProgress} color="text-primary" />
            <StatCard label="Resolved" value={stats.resolved} color="text-success" />
            <StatCard
              label="Overdue (7+ days)"
              value={stats.overdue}
              color={stats.overdue > 0 ? 'text-danger' : 'text-success'}
            />
          </div>

          {stats.overdue > 0 && (
            <div className="alert alert-warning small py-2 mb-4">
              ⚠️ You have <strong>{stats.overdue}</strong> overdue complaint{stats.overdue > 1 ? 's' : ''} older than 7 days.
              Visit <Link to="/staff/assigned" className="alert-link">Assigned Complaints</Link> to take action.
            </div>
          )}

          {/* Recent Activity */}
          <div className="section-card">
            <div className="section-card-header justify-content-between">
              <span>📋 Recent Assigned Complaints</span>
              <Link to="/staff/assigned" className="btn btn-outline-primary btn-sm">
                View Full Queue →
              </Link>
            </div>

            {(!stats.recent || stats.recent.length === 0) ? (
              <div className="text-center py-5 text-muted">
                <span className="fs-2 d-block mb-2">🎉</span>
                <p>No complaints currently assigned to you.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Ref #</th>
                      <th>Title</th>
                      <th>Citizen</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((c) => (
                      <tr key={c._id}>
                        <td><code className="text-primary">{c.reference}</code></td>
                        <td className="fw-semibold">{c.title}</td>
                        <td className="text-muted small">{c.citizen?.name || '—'}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td className="text-muted small">{new Date(c.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StaffDashboard;
