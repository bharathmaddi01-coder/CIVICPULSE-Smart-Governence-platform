// src/components/common/ProtectedRoute.jsx
// Guards routes by checking authentication and permitted roles.

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show clean spinner while restoring initial session
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mt-2 small">Verifying session...</p>
      </div>
    );
  }

  // Not authenticated -> redirect to login with redirect back location
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role restriction check
  if (allowedRoles.length > 0) {
    const userRole = (user.role || '').toUpperCase();
    const isAllowed = allowedRoles.some((r) => r.toUpperCase() === userRole);
    if (!isAllowed) {
      return (
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div className="card civic-card border-danger">
                <div className="card-header bg-danger text-white fw-bold">
                  Access Denied
                </div>
                <div className="card-body p-4 text-center">
                  <p className="text-muted mb-3">
                    Your current account role (<strong>{user.role}</strong>) does not have permission to view this page.
                  </p>
                  <a href={`/${user.role.toLowerCase()}/dashboard`} className="btn btn-outline-danger btn-sm">
                    Go to My Dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
