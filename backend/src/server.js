// src/server.js
// Application entry point.
// Loads environment variables, connects to MongoDB, then starts the HTTP server.

import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`CivicPulse API running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/api/healthz`);
  });
});
