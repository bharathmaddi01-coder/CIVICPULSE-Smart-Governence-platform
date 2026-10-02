// src/config/db.js
// MongoDB connection using Mongoose.
// Called once at startup from server.js.

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit process with failure — cannot run without DB
  }
};

export default connectDB;
