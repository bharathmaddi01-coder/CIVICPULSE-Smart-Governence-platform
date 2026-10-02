// scripts/migrateRoles.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicpulse');
    console.log('Connected to DB');

    const res1 = await User.updateMany({ role: 'citizen' }, { $set: { role: 'CITIZEN' } });
    const res2 = await User.updateMany({ role: 'staff' }, { $set: { role: 'STAFF' } });
    const res3 = await User.updateMany({ role: 'admin' }, { $set: { role: 'ADMIN' } });

    console.log('Migration results:', {
      citizen: res1.modifiedCount,
      staff: res2.modifiedCount,
      admin: res3.modifiedCount,
    });

    const user = await User.findOne({ email: '239x1a05c4@gprec.ac.in' });
    console.log('User 239x1a05c4@gprec.ac.in now has role:', user?.role);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
