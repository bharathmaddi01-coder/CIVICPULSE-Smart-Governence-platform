// src/components/layout/Navbar.jsx
// Role-aware navigation bar using Bootstrap responsive styling.

import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeNav = () => setNavOpen(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark civic-navbar sticky-top">
      <div className="container">
        {/* Brand */}
        <Link to="/" className="navbar-brand d-flex align-items-center" onClick={closeNav}>
          <span className="civic-brand-seal">🏛</span>
          <div>
            <span className="fw-bold tracking-tight">CivicPulse</span>
            <small className="d-block text-white-50" style={{ fontSize: '0.72rem' }}>
              Smart Governance Platform
            </small>
          </div>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setNavOpen(!navOpen)}
          aria-controls="civicNavbarContent"
          aria-expanded={navOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Content */}
        <div className={`collapse navbar-collapse ${navOpen ? 'show' : ''}`} id="civicNavbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink to="/" className="nav-link civic-nav-link" end onClick={closeNav}>
                Home
              </NavLink>
            </li>

            {/* CITIZEN Navigation */}
            {isAuthenticated && user?.role?.toUpperCase() === 'CITIZEN' && (
              <>
                <li className="nav-item">
                  <NavLink to="/citizen/dashboard" className="nav-link civic-nav-link" onClick={closeNav}>
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/citizen/complaints" className="nav-link civic-nav-link" onClick={closeNav}>
                    My Complaints
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/citizen/notifications" className="nav-link civic-nav-link" onClick={closeNav}>
                    Notifications
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/citizen/profile" className="nav-link civic-nav-link" onClick={closeNav}>
                    Profile
                  </NavLink>
                </li>
              </>
            )}

            {/* STAFF Navigation */}
            {isAuthenticated && user?.role?.toUpperCase() === 'STAFF' && (
              <>
                <li className="nav-item">
                  <NavLink to="/staff/dashboard" className="nav-link civic-nav-link" onClick={closeNav}>
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/staff/assigned" className="nav-link civic-nav-link" onClick={closeNav}>
                    Assigned Complaints
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/staff/notifications" className="nav-link civic-nav-link" onClick={closeNav}>
                    Notifications
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/staff/profile" className="nav-link civic-nav-link" onClick={closeNav}>
                    Profile
                  </NavLink>
                </li>
              </>
            )}

            {/* ADMIN Navigation */}
            {isAuthenticated && user?.role?.toUpperCase() === 'ADMIN' && (
              <>
                <li className="nav-item">
                  <NavLink to="/admin/dashboard" className="nav-link civic-nav-link" onClick={closeNav}>
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/users" className="nav-link civic-nav-link" onClick={closeNav}>
                    Users
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/departments" className="nav-link civic-nav-link" onClick={closeNav}>
                    Departments
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/complaints" className="nav-link civic-nav-link" onClick={closeNav}>
                    Complaints
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/contact" className="nav-link civic-nav-link" onClick={closeNav}>
                    Contact Messages
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/notifications" className="nav-link civic-nav-link" onClick={closeNav}>
                    Notifications
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          {/* Right Action / Auth Status */}
          <div className="d-flex align-items-center gap-2">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn btn-outline-light btn-sm px-3" onClick={closeNav}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-light btn-sm text-success fw-semibold px-3" onClick={closeNav}>
                  Register
                </Link>
              </>
            ) : (
              <div className="d-flex align-items-center gap-3">
                <div className="text-end text-white d-none d-md-block">
                  <div className="small fw-semibold">{user?.name}</div>
                  <span className="badge bg-light text-success role-badge">{user?.role}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm px-3"
                  onClick={() => {
                    closeNav();
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
