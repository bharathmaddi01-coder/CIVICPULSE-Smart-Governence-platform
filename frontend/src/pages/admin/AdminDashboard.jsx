// src/pages/admin/AdminDashboard.jsx
// Admin Dashboard: platform KPIs, status breakdown, department breakdown, recent complaints.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import api from '../../services/api.js';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/dashboard/admin');
        setStats(res.data);
      } catch (err) {
        console.error('Admin dashboard error:', err);
        setError('Failed to load admin dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const KPICard = ({ label, value, color, icon }) => (
    <div className="col-6 col-md-3">
      <div className="stat-card h-100">
        <div className="stat-value" style={{ color }}>
          {icon && <span className="me-1" style={{ fontSize: '1.4rem' }}>{icon}</span>}
          {value ?? 0}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );

  const resolutionRate = stats
    ? Math.round(((stats.resolvedComplaints || 0) / Math.max(stats.totalComplaints, 1)) * 100)
    : 0;

  return (
    <div className="container py-4">
      {/* Welcome Banner */}
      <div className="civic-card p-3 mb-4 border-start border-4 border-danger">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <span className="civic-badge mb-1" style={{ background: '#f8d7da', color: '#58151c' }}>Admin Portal</span>
            <h5 className="fw-bold mb-0 mt-1">Platform Oversight Dashboard</h5>
            <small className="text-muted">{user?.name} &bull; {user?.email}</small>
          </div>
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 fw-semibold">
            ADMIN
          </span>
        </div>
      </div>

      {error && <div className="alert alert-danger small py-2">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status" />
          <p className="text-muted mt-2 small">Loading platform data…</p>
        </div>
      ) : stats && (
        <>
          {/* KPI Cards */}
          <div className="row g-3 mb-4">
            <KPICard label="Total Users" value={stats.totalUsers} color="#212529" icon="👥" />
            <KPICard label="Total Complaints" value={stats.totalComplaints} color="#0f5132" icon="📋" />
            <KPICard label="Departments" value={stats.departments} color="#084298" icon="🏢" />
            <KPICard label="Resolution Rate" value={`${resolutionRate}%`} color={resolutionRate > 70 ? '#198754' : '#dc3545'} icon="✅" />
          </div>

          {/* Quick Nav Links */}
          <div className="row g-3 mb-4">
            {[
              { to: '/admin/complaints', label: 'All Complaints', icon: '📋', desc: 'Oversight & Management' },
              { to: '/admin/departments', label: 'Departments', icon: '🏢', desc: 'Manage & Add Departments' },
              { to: '/admin/users', label: 'Users Directory', icon: '👥', desc: 'Citizens, Staff & Admins' },
            ].map((link) => (
              <div key={link.to} className="col-md-4">
                <Link to={link.to} className="text-decoration-none">
                  <div className="civic-card p-3 h-100 d-flex align-items-center gap-3">
                    <span style={{ fontSize: '1.8rem' }}>{link.icon}</span>
                    <div>
                      <div className="fw-semibold text-dark">{link.label}</div>
                      <small className="text-muted">{link.desc}</small>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="row g-4">
            {/* Status Breakdown */}
            <div className="col-md-5">
              <div className="section-card">
                <div className="section-card-header">📊 Status Breakdown</div>
                <div className="p-3">
                  {Object.entries(stats.statusBreakdown || {}).map(([status, count]) => {
                    const pct = Math.round((count / Math.max(stats.totalComplaints, 1)) * 100);
                    return (
                      <div key={status} className="mb-2">
                        <div className="d-flex justify-content-between small mb-1">
                          <StatusBadge status={status} />
                          <span className="text-muted">{count} ({pct}%)</span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="col-md-7">
              <div className="section-card">
                <div className="section-card-header">🏢 Department Load</div>
                <div className="p-3">
                  {(stats.departmentBreakdown || []).length === 0 ? (
                    <p className="text-muted small">No department data.</p>
                  ) : (
                    stats.departmentBreakdown.map((dept, idx) => {
                      const pct = Math.round((dept.count / Math.max(stats.totalComplaints, 1)) * 100);
                      return (
                        <div key={idx} className="mb-2">
                          <div className="d-flex justify-content-between small mb-1">
                            <span className="fw-semibold">{dept.department}</span>
                            <span className="text-muted">{dept.count} complaint{dept.count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="progress" style={{ height: '6px' }}>
                            <div className="progress-bar bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Complaints */}
          <div className="section-card mt-4">
            <div className="section-card-header justify-content-between">
              <span>📋 Recent Platform Complaints</span>
              <Link to="/admin/complaints" className="btn btn-outline-danger btn-sm">View All →</Link>
            </div>
            <div className="table-scroll">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Ref #</th>
                    <th>Title</th>
                    <th>Citizen</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.recent || []).map((c) => (
                    <tr key={c._id}>
                      <td><code className="text-danger">{c.reference}</code></td>
                      <td className="fw-semibold">{c.title}</td>
                      <td className="text-muted small">{c.citizen?.name || '—'}</td>
                      <td className="text-muted small">{c.department?.name || '—'}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="text-muted small">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
