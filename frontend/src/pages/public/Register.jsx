// src/pages/public/Register.jsx
// Citizen registration page.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await register(formData.name.trim(), formData.email.trim(), formData.password);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
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
              <h4 className="fw-bold mb-1">Citizen Registration</h4>
              <p className="text-muted small mb-0">Create an account to report and track municipal civic issues</p>
            </div>

            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success py-2 small" role="alert">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="e.g. John Citizen"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </div>

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
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 py-2 fw-semibold"
                  disabled={submitting || !!success}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating account...
                    </>
                  ) : (
                    'Register'
                  )}
                </button>
              </form>
            </div>

            <div className="card-footer bg-light text-center py-3">
              <small className="text-muted">
                Already registered?{' '}
                <Link to="/login" className="text-success fw-semibold text-decoration-none">
                  Sign in here
                </Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
