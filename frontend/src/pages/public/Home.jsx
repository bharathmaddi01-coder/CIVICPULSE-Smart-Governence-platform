// src/pages/public/Home.jsx
// Professional civic landing page explaining platform purpose and service workflow.

import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div>
      {/* Hero Header */}
      <section className="civic-hero">
        <div className="container py-4 text-center">
          <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-semibold mb-3 border border-success-subtle">
            Official Citizen Grievance Portal
          </span>
          <h1 className="display-5 fw-bold text-dark mb-3">
            Report. Track. Resolve.
          </h1>
          <p className="lead text-muted mx-auto mb-4" style={{ maxWidth: '720px' }}>
            CivicPulse connects citizens directly with municipal departments to report public infrastructure issues, monitor service timelines in real-time, and verify resolution quality.
          </p>

          <div className="d-flex justify-content-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="btn btn-success btn-lg px-4 shadow-sm">
                  Register as Citizen
                </Link>
                <Link to="/login" className="btn btn-outline-success btn-lg px-4">
                  Sign In to Portal
                </Link>
              </>
            ) : (
              <Link to={`/${user.role.toLowerCase()}/dashboard`} className="btn btn-success btn-lg px-4 shadow-sm">
                Open {user.role} Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-5">
        <div className="container">
          <h3 className="section-title">How CivicPulse Works</h3>
          <p className="text-muted mb-4">
            A transparent 5-step lifecycle ensuring accountability from initial submission to final verification.
          </p>

          <div className="row g-4">
            <div className="col-md-6 col-lg">
              <div className="card civic-card step-card p-3 shadow-sm">
                <div className="step-num">1</div>
                <h6 className="fw-bold mb-2">Submit Issue</h6>
                <p className="small text-muted mb-0">
                  Citizens submit geotagged complaints with descriptions and optional photos.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg">
              <div className="card civic-card step-card p-3 shadow-sm">
                <div className="step-num">2</div>
                <h6 className="fw-bold mb-2">Auto-Routing</h6>
                <p className="small text-muted mb-0">
                  Issues are automatically routed to the right municipal department and assigned to least-loaded staff.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg">
              <div className="card civic-card step-card p-3 shadow-sm">
                <div className="step-num">3</div>
                <h6 className="fw-bold mb-2">Field Action</h6>
                <p className="small text-muted mb-0">
                  Assigned staff starts on-site investigation and updates complaint status to In-Progress.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg">
              <div className="card civic-card step-card p-3 shadow-sm">
                <div className="step-num">4</div>
                <h6 className="fw-bold mb-2">Resolution</h6>
                <p className="small text-muted mb-0">
                  Staff logs completed repairs and submits formal resolution notes.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg">
              <div className="card civic-card step-card p-3 shadow-sm">
                <div className="step-num">5</div>
                <h6 className="fw-bold mb-2">Citizen Audit</h6>
                <p className="small text-muted mb-0">
                  The citizen verifies the resolution quality. Accept to close or reject to reopen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Citizen Trust & Governance Section */}
      <section className="py-4 bg-white border-top border-bottom">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-md-4 text-center">
              <div className="p-3">
                <div className="h3 text-success fw-bold mb-1">100%</div>
                <div className="fw-semibold">In-App Tracking</div>
                <small className="text-muted">Full timestamped audit history for every status change.</small>
              </div>
            </div>
            <div className="col-md-4 text-center border-start border-end">
              <div className="p-3">
                <div className="h3 text-success fw-bold mb-1">Municipal</div>
                <div className="fw-semibold">Direct Routing</div>
                <small className="text-muted">Electricity, Water Supply, Sanitation, Public Works, Roads.</small>
              </div>
            </div>
            <div className="col-md-4 text-center">
              <div className="p-3">
                <div className="h3 text-success fw-bold mb-1">Citizen First</div>
                <div className="fw-semibold">Closing Authority</div>
                <small className="text-muted">Only the reporting citizen can confirm and close a complaint.</small>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
