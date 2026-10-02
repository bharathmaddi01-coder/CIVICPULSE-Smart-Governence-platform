// src/pages/public/NotFound.jsx
// 404 page for unknown routes.

import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="container py-5 text-center">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card civic-card p-5 shadow-sm">
            <h1 className="display-4 text-success fw-bold">404</h1>
            <h4 className="fw-semibold mb-3">Page Not Found</h4>
            <p className="text-muted mb-4">
              The page you requested does not exist or may have been moved.
            </p>
            <div>
              <Link to="/" className="btn btn-success px-4">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
