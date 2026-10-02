// src/App.jsx
// Main application component with React Router and AuthProvider.
// All roles have full working pages — no placeholder pages remain.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';

import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

// Public Pages
import Home from './pages/public/Home.jsx';
import Login from './pages/public/Login.jsx';
import Register from './pages/public/Register.jsx';
import NotFound from './pages/public/NotFound.jsx';

// Citizen Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard.jsx';
import CitizenComplaintsPage from './pages/citizen/CitizenComplaintsPage.jsx';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard.jsx';
import AssignedComplaints from './pages/staff/AssignedComplaints.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AllComplaints from './pages/admin/AllComplaints.jsx';
import Departments from './pages/admin/Departments.jsx';
import Users from './pages/admin/Users.jsx';

// Shared Pages
import Notifications from './pages/shared/Notifications.jsx';
import Profile from './pages/shared/Profile.jsx';

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />

          <main className="flex-grow-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ====================================================
                  CITIZEN ROUTES
              ==================================================== */}
              <Route
                path="/citizen/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/complaints"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN']}>
                    <CitizenComplaintsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/notifications"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN']}>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/profile"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* ====================================================
                  STAFF ROUTES
              ==================================================== */}
              <Route
                path="/staff/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['STAFF']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/assigned"
                element={
                  <ProtectedRoute allowedRoles={['STAFF']}>
                    <AssignedComplaints />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/notifications"
                element={
                  <ProtectedRoute allowedRoles={['STAFF']}>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/profile"
                element={
                  <ProtectedRoute allowedRoles={['STAFF']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* ====================================================
                  ADMIN ROUTES
              ==================================================== */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/complaints"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AllComplaints />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/departments"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Departments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/profile"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
