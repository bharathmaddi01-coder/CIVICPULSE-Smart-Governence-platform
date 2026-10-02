// src/components/citizen/ComplaintForm.jsx
// Form allowing citizens to register new civic complaints.

import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export const ComplaintForm = ({ onComplaintCreated }) => {
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    category: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    photoData: '',
  });

  const [geoLocating, setGeoLocating] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Fetch active departments for the dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepts(true);
        const res = await api.get('/departments');
        // Backend returns either array directly or { departments: [...] }
        const depts = Array.isArray(res.data) ? res.data : (res.data.departments || []);
        const activeDepts = depts.filter((d) => d.active !== false);
        setDepartments(activeDepts);
        if (activeDepts.length > 0) {
          setFormData((prev) => ({ ...prev, departmentId: activeDepts[0]._id }));
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
        setError('Failed to load departments. Please refresh the page.');
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // Auto-detect GPS location using HTML5 Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setGeoLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setError('Unable to retrieve location automatically. Please enter coordinates manually.');
        setGeoLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Convert uploaded image to Base64 data URL
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG).');
      return;
    }

    // Limit to 4MB for safety
    if (file.size > 4 * 1024 * 1024) {
      setError('Image file size must be less than 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setFormData((prev) => ({ ...prev, photoData: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData((prev) => ({ ...prev, photoData: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    // Form validation
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setError('Complaint title must be at least 3 characters.');
      return;
    }

    if (!formData.departmentId) {
      setError('Please select a responsible department.');
      return;
    }

    if (!formData.category.trim() || formData.category.trim().length < 2) {
      setError('Please select or specify a complaint category.');
      return;
    }

    if (!formData.location.trim()) {
      setError('Please provide the physical address or landmark of the issue.');
      return;
    }

    if (formData.latitude === '' || formData.longitude === '') {
      setError('Coordinates (latitude and longitude) are required. Use the "Auto-detect GPS" button or enter manually.');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lon = parseFloat(formData.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be a valid number between -90 and 90.');
      return;
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setError('Please describe the issue in detail (at least 10 characters).');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: formData.title.trim(),
        departmentId: formData.departmentId,
        category: formData.category.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        latitude: lat,
        longitude: lon,
        photoData: formData.photoData || null,
      };

      const res = await api.post('/complaints', payload);
      const created = res.data.complaint;

      setSuccess({
        reference: created.reference,
        status: created.status,
        message: 'Your complaint has been submitted and registered successfully.',
      });

      // Reset form
      setFormData({
        title: '',
        departmentId: departments[0]?._id || '',
        category: '',
        description: '',
        location: '',
        latitude: '',
        longitude: '',
        photoData: '',
      });
      setPhotoPreview(null);

      if (onComplaintCreated) {
        onComplaintCreated(created);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit complaint. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const commonCategories = [
    'Pothole / Road Damage',
    'Streetlight Failure',
    'Water Pipe Leakage',
    'Sewage / Drainage Overflow',
    'Garbage Accumulation',
    'Illegal Dumping',
    'Broken Traffic Signal',
    'Public Park Maintenance',
    'Other Civic Issue',
  ];

  return (
    <div className="card civic-card shadow-sm">
      <div className="card-header bg-white py-3 border-bottom">
        <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
          <span className="me-2">📝</span> Register New Complaint
        </h5>
        <small className="text-muted">
          Submit municipal issues directly to the concerned department for prompt resolution.
        </small>
      </div>

      <div className="card-body p-4">
        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success py-3" role="alert">
            <h6 className="alert-heading fw-bold mb-1">✅ Complaint Submitted!</h6>
            <p className="mb-1 small">{success.message}</p>
            <div className="small">
              Reference Number:{' '}
              <span className="badge bg-success font-monospace fs-6">{success.reference}</span>
              <span className="ms-2 badge bg-warning text-dark">{success.status}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Complaint Title */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">
              Complaint Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="title"
              className="form-control"
              placeholder="e.g. Deep pothole causing traffic obstruction"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="row g-3 mb-3">
            {/* Department */}
            <div className="col-md-6">
              <label className="form-label small fw-semibold">
                Department <span className="text-danger">*</span>
              </label>
              <select
                name="departmentId"
                className="form-select"
                value={formData.departmentId}
                onChange={handleChange}
                disabled={loadingDepts}
                required
              >
                {loadingDepts ? (
                  <option value="">Loading departments...</option>
                ) : departments.length === 0 ? (
                  <option value="">No departments available</option>
                ) : (
                  departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Category */}
            <div className="col-md-6">
              <label className="form-label small fw-semibold">
                Category <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                list="category-suggestions"
                name="category"
                className="form-control"
                placeholder="Select or type category..."
                value={formData.category}
                onChange={handleChange}
                required
              />
              <datalist id="category-suggestions">
                {commonCategories.map((cat, idx) => (
                  <option key={idx} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Location Address */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">
              Address / Landmark <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="location"
              className="form-control"
              placeholder="e.g. Near Community Center, 4th Cross, Ward 12"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          {/* GPS Coordinates */}
          <div className="card bg-light border-0 p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
              <label className="form-label small fw-semibold mb-0">
                GPS Coordinates <span className="text-danger">*</span>
              </label>
              <button
                type="button"
                className="btn btn-outline-success btn-sm"
                onClick={handleDetectLocation}
                disabled={geoLocating}
              >
                {geoLocating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Detecting GPS...
                  </>
                ) : (
                  '📍 Auto-detect GPS'
                )}
              </button>
            </div>

            <div className="row g-2">
              <div className="col-sm-6">
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  className="form-control form-control-sm"
                  placeholder="Latitude (e.g. 15.8281)"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-sm-6">
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  className="form-control form-control-sm"
                  placeholder="Longitude (e.g. 78.0373)"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <small className="text-muted mt-1" style={{ fontSize: '0.78rem' }}>
              Coordinates allow the assigned staff to accurately navigate to the reported issue.
            </small>
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              name="description"
              rows={4}
              className="form-control"
              placeholder="Please provide full details about the issue, severity, duration, and safety concerns..."
              value={formData.description}
              onChange={handleChange}
              required
            ></textarea>
            <small className="text-muted" style={{ fontSize: '0.78rem' }}>
              Minimum 10 characters required.
            </small>
          </div>

          {/* Photo Attachment (Optional) */}
          <div className="mb-4">
            <label className="form-label small fw-semibold">Photo Evidence (Optional)</label>
            <input
              type="file"
              accept="image/*"
              className="form-control form-control-sm"
              onChange={handlePhotoUpload}
            />

            {photoPreview && (
              <div className="mt-2 position-relative d-inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="img-thumbnail"
                  style={{ maxHeight: '150px', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                  onClick={handleRemovePhoto}
                  title="Remove photo"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="d-flex justify-content-end gap-2">
            <button
              type="submit"
              className="btn btn-success px-4 py-2 fw-semibold"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Submitting Complaint...
                </>
              ) : (
                'Submit Complaint'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintForm;
