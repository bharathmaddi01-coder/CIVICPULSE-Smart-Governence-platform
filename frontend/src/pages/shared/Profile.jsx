// src/pages/shared/Profile.jsx
// Shared profile page — edit name & email. Available to all roles.

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';

export const Profile = () => {
  const { user } = useAuth();

  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users/profile');
        const u = res.data.user;
        setForm({ name: u.name || '', email: u.email || '' });
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await api.put('/users/profile', { name: form.name.trim(), email: form.email.trim() });
      setSuccess('Profile updated successfully. Changes will take effect on next login.');
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed.');
    } finally {
      setSaving(false);
    }
  };

  const ROLE_COLOR = { CITIZEN: 'success', STAFF: 'primary', ADMIN: 'danger' };
  const roleColor = ROLE_COLOR[user?.role] || 'secondary';

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-6">
          <div className="section-title mb-4">
            <h4>My Profile</h4>
          </div>

          {/* Role Card */}
          <div className={`civic-card p-3 mb-4 border-start border-4 border-${roleColor}`}>
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: '#f8f9fa', border: '1px solid #dee2e6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                }}
              >
                {user?.role === 'ADMIN' ? '🏛' : user?.role === 'STAFF' ? '🏢' : '👤'}
              </div>
              <div>
                <div className="fw-bold">{user?.name}</div>
                <small className="text-muted">{user?.email}</small>
                <div className="mt-1">
                  <span className={`badge bg-${roleColor}-subtle text-${roleColor} border border-${roleColor}-subtle px-2 py-1`} style={{ fontSize: '0.7rem' }}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="section-card">
            <div className="section-card-header">✏️ Edit Profile</div>
            <div className="p-4">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-secondary" role="status" />
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className="alert alert-danger small p-2 mb-3">{error}</div>}
                  {success && <div className="alert alert-success small p-2 mb-3">{success}</div>}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(''); setSuccess(''); }}
                      disabled={saving}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(''); setSuccess(''); }}
                      disabled={saving}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-success w-100 py-2 fw-semibold" disabled={saving}>
                    {saving ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                    ) : (
                      'Save Profile'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="alert alert-light border small mt-3">
            <strong>ℹ️ Note:</strong> You cannot change your role or department via this page.
            Role changes require admin assistance.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
