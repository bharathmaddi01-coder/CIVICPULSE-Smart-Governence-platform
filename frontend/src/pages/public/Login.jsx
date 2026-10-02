// src/pages/public/Login.jsx
// User sign-in page for Citizens, Staff, and Administrators.

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname;

  // Default dashboards per role
  const defaultDashboard = {
    CITIZEN: '/citizen/dashboard',
    STAFF:   '/staff/dashboard',
    ADMIN:   '/admin/dashboard',
  };

  // Role-owned path prefixes — a citizen must not be redirected to /admin/...
  const allowedPrefixes = {
    CITIZEN: ['/citizen/'],
    STAFF:   ['/staff/'],
    ADMIN:   ['/admin/'],
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login(formData.email.trim(), formData.password);

      const role = user.role; // 'CITIZEN' | 'STAFF' | 'ADMIN'

      // Only honour the stored "from" path if it actually belongs to this role.
      // This prevents a citizen from being sent to /admin/complaints if the
      // browser had previously tried that URL before they authenticated.
      const prefixes = allowedPrefixes[role] || [];
      const fromIsValid = from && prefixes.some((prefix) => from.startsWith(prefix));

      const destination = fromIsValid ? from : (defaultDashboard[role] || '/');
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card civic-card shadow-sm">
            <div className="civic-card-header text-center py-3 bg-white">
              <span className="civic-brand-seal mb-2">🏛</span>
              <h4 className="fw-bold mb-1">Portal Sign In</h4>
              <p className="text-muted small mb-0">Sign in to access your CivicPulse workspace</p>
            </div>

            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 py-2 fw-semibold"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>

            <div className="card-footer bg-light text-center py-3">
              <small className="text-muted">
                New citizen?{' '}
                <Link to="/register" className="text-success fw-semibold text-decoration-none">
                  Register for an account
                </Link>
              </small>
            </div>
          </div>

          {/* Quick Demo Credentials Assistant */}
          <div className="card civic-card shadow-sm mt-3 bg-light border-0">
            <div className="card-body p-3">
              <h6 className="fw-bold mb-2 small text-dark d-flex align-items-center">
                <span className="me-2">🔑</span> Quick Demo Credentials (Click to Fill):
              </h6>

              <div className="d-flex flex-column gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary text-start d-flex justify-content-between align-items-center"
                  onClick={() => setFormData({ email: 'ramesh.staff@civicpulse.local', password: 'Password@123' })}
                >
                  <div>
                    <strong className="d-block">🏢 Department Staff</strong>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      ramesh.staff@civicpulse.local &bull; Sanitation Dept
                    </small>
                  </div>
                  <span className="badge bg-primary">STAFF</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger text-start d-flex justify-content-between align-items-center"
                  onClick={() => setFormData({ email: 'admin@test.com', password: 'admin123' })}
                >
                  <div>
                    <strong className="d-block">🏛 Portal Administrator</strong>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      admin@test.com &bull; Platform Oversight
                    </small>
                  </div>
                  <span className="badge bg-danger">ADMIN</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-success text-start d-flex justify-content-between align-items-center"
                  onClick={() => setFormData({ email: '239x1a05c4@gprec.ac.in', password: 'Password123' })}
                >
                  <div>
                    <strong className="d-block">👤 Citizen User</strong>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      239x1a05c4@gprec.ac.in &bull; Grievance Redressal
                    </small>
                  </div>
                  <span className="badge bg-success">CITIZEN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
