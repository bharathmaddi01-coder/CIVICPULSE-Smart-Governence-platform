// src/pages/admin/Users.jsx
// Admin: user directory with role filter + create user modal.

import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CITIZEN', departmentId: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await api.get('/users', { params });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    api.get('/departments').then((r) => setDepartments(r.data.departments || [])).catch(() => {});
  }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const openCreate = () => {
    setForm({ name: '', email: '', password: '', role: 'CITIZEN', departmentId: '' });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
    setFormSuccess('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFormError('Name, email, and password are required.');
      return;
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (form.role === 'STAFF' && !form.departmentId) {
      setFormError('Department is required for staff accounts.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(form.role === 'STAFF' && { departmentId: form.departmentId }),
      };
      await api.post('/users', payload);
      setFormSuccess(`${form.role} user created successfully.`);
      fetchUsers();
      setTimeout(closeModal, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const ROLE_BADGE = {
    CITIZEN: 'bg-success-subtle text-success',
    STAFF:   'bg-primary-subtle text-primary',
    ADMIN:   'bg-danger-subtle text-danger',
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-bold mb-0">Users Directory</h4>
          <small className="text-muted">Manage citizens, staff, and administrators</small>
        </div>
        <button className="btn btn-danger btn-sm" onClick={openCreate}>
          ➕ Create User
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
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-secondary" type="submit">Search</button>
              </form>
            </div>
            <div className="col-md-5">
              <select
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="CITIZEN">Citizen</option>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger small py-2">{error}</div>}

      <div className="section-card">
        <div className="section-card-header">👥 Users ({users.length})</div>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger spinner-border-sm" role="status" />
            <span className="ms-2 text-muted small">Loading…</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p>No users match the current search/filter.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-semibold">{u.name}</td>
                    <td className="text-muted small">{u.email}</td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[u.role] || 'bg-secondary'} px-2 py-1`} style={{ fontSize: '0.75rem' }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {u.department?.name || (u.role === 'STAFF' ? <span className="text-warning">No dept</span> : '—')}
                    </td>
                    <td className="text-muted small">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-box-header">
              <h6 className="mb-0 fw-bold">➕ Create User Account</h6>
              <button className="btn-close" onClick={closeModal} />
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-box-body">
                {formError && <div className="alert alert-danger small p-2 mb-3">{formError}</div>}
                {formSuccess && <div className="alert alert-success small p-2 mb-3">{formSuccess}</div>}

                <div className="mb-2">
                  <label className="form-label small fw-semibold">Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label small fw-semibold">Email <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label small fw-semibold">Password <span className="text-danger">*</span></label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label small fw-semibold">Role <span className="text-danger">*</span></label>
                  <select
                    className="form-select form-select-sm"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value, departmentId: '' })}
                    disabled={saving}
                  >
                    <option value="CITIZEN">Citizen</option>
                    <option value="STAFF">Staff</option>
                  </select>
                  <small className="text-muted">Admin accounts cannot be created via this form.</small>
                </div>

                {form.role === 'STAFF' && (
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">
                      Department <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={form.departmentId}
                      onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                      required
                      disabled={saving}
                    >
                      <option value="">— Select department —</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-box-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-danger btn-sm" disabled={saving}>
                  {saving ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
