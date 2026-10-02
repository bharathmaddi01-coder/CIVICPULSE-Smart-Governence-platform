// src/app.js
// Express application configuration.
// Registers middleware and mounts the health-check route.
// All feature routes will be mounted here as they are implemented.

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

const app = express();

// ---------------------------------------------------------------------------
// CORS — allow only the configured frontend origin
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// ---------------------------------------------------------------------------
// Body parsers
// 10 MB limit to support optional Base64 photo payloads (see PROJECT_CONTEXT)
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------------------------------------------------------------
// Feature routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contact', contactRoutes);

// ---------------------------------------------------------------------------
// Health-check route — GET /api/healthz
// Returns 200 so deployment tools and load balancers can confirm the server
// is alive without requiring authentication.
// ---------------------------------------------------------------------------
app.get('/api/healthz', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'CivicPulse API',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// 404 — catch-all for unknown routes
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

export default app;
