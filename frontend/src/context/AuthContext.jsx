// src/context/AuthContext.jsx
// React Context providing authentication state (user, token, login, logout, loading).

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on mount using GET /api/auth/me
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        const rawUser = response.data.user;
        const normalized = rawUser
          ? { ...rawUser, role: (rawUser.role || 'CITIZEN').toUpperCase() }
          : null;
        setUser(normalized);
        setToken(storedToken);
      } catch (err) {
        console.warn('Session expired or invalid, logging out:', err.message);
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = response.data;
    const normalized = receivedUser
      ? { ...receivedUser, role: (receivedUser.role || 'CITIZEN').toUpperCase() }
      : null;

    localStorage.setItem('token', receivedToken);
    setToken(receivedToken);
    setUser(normalized);

    return normalized;
  };

  // Register handler (public citizen registration)
  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to consume the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
