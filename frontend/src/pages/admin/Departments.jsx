// src/pages/admin/Departments.jsx
// Admin: Department list table + Create/Edit modal + Deactivate.

import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, object = edit
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/departments', { params: { all: 'true' } });
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', description: '' });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditTarget(dept);
    setForm({ name: dept.name, description: dept.description || '' });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setFormError('');
    setFormSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      setFormError('Department name must be at least 2 characters.');
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 5) {
      setFormError('Description must be at least 5 characters.');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      if (editTarget) {
        await api.put(`/departments/${editTarget._id}`, { name: form.name.trim(), description: form.description.trim() });
        setFormSuccess('Department updated successfully.');
      } else {
        await api.post('/departments', { name: form.name.trim(), description: form.description.trim() });
        setFormSuccess('Department created successfully.');
      }
      fetchDepartments();
      setTimeout(closeModal, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (dept) => {
    if (!window.confirm(`Deactivate department "${dept.name}"? It will no longer accept new complaints.`)) return;
    try {
      await api.delete(`/departments/${dept._id}`);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Deactivation failed.');
    }
  };

  const handleReactivate = async (dept) => {
    try {
      await api.put(`/departments/${dept._id}`, { active: true });
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Reactivation failed.');
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-bold mb-0">Departments</h4>
          <small className="text-muted">Manage municipal departments — create, edit, and deactivate</small>
        </div>
        <button className="btn btn-danger btn-sm" onClick={openCreate}>
          ➕ Add Department
        </button>
      </div>

      {error && <div className="alert alert-danger small py-2">{error}</div>}

      <div className="section-card">
        <div className="section-card-header">🏢 Departments ({departments.length})</div>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger spinner-border-sm" role="status" />
            <span className="ms-2 text-muted small">Loading…</span>
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p>No departments found. Create one to get started.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept._id}>
                    <td className="fw-semibold">{dept.name}</td>
                    <td className="text-muted small">{dept.description}</td>
                    <td>
                      {dept.active
                        ? <span className="badge bg-success">Active</span>
                        : <span className="badge bg-secondary">Inactive</span>}
                    </td>
                    <td className="text-muted small">{new Date(dept.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => openEdit(dept)}
                        >
                          ✏️ Edit
                        </button>
                        {dept.active ? (
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleDeactivate(dept)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => handleReactivate(dept)}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-box-header">
              <h6 className="mb-0 fw-bold">
                {editTarget ? `✏️ Edit: ${editTarget.name}` : '➕ Create Department'}
              </h6>
              <button className="btn-close" onClick={closeModal} />
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-box-body">
                {formError && <div className="alert alert-danger small p-2 mb-3">{formError}</div>}
                {formSuccess && <div className="alert alert-success small p-2 mb-3">{formSuccess}</div>}

                <div className="mb-3">
                  <label className="form-label small fw-semibold">
                    Department Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Roads & Transport"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">
                    Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={3}
                    placeholder="Brief description of department responsibilities..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="modal-box-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-danger btn-sm" disabled={saving}>
                  {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
