// src/pages/common/PlaceholderPage.jsx
// Reusable placeholder page for secondary routes during foundation phase.

import { useAuth } from '../../context/AuthContext.jsx';

export const PlaceholderPage = ({ title = 'Page Under Development' }) => {
  const { user } = useAuth();

  return (
    <div className="container py-4">
      <div className="section-title">
        <h4 className="mb-0">{title}</h4>
      </div>

      <div className="card civic-card shadow-sm p-4 text-center my-4">
        <div className="py-4">
          <span className="civic-brand-seal mb-3 d-inline-flex" style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}>
            🏛
          </span>
          <h5 className="fw-bold mb-2">{title}</h5>
          <p className="text-muted small mb-3" style={{ maxWidth: '480px', margin: '0 auto' }}>
            This feature is scheduled for Phase 2. Protected route routing and role access controls are active for <strong>{user?.role}</strong>.
          </p>
          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
            Status: Foundation Verified
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
