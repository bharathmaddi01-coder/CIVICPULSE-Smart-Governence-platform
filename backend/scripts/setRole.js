// scripts/setRole.js
// Utility script to change a user's role (CITIZEN, STAFF, ADMIN)
// Usage:
//   node scripts/setRole.js <email> <ROLE>
// Example:
//   node scripts/setRole.js bharath.maddi01@gmail.com ADMIN

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

async function setRole() {
  const args = process.argv.slice(2);
  const email = (args[0] || 'bharath.maddi01@gmail.com').toLowerCase().trim();
  const targetRole = (args[1] || 'ADMIN').toUpperCase().trim();

  const validRoles = ['CITIZEN', 'STAFF', 'ADMIN'];
  if (!validRoles.includes(targetRole)) {
    console.error(`❌ Invalid role: "${targetRole}". Must be one of: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicpulse');
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    const oldRole = user.role;
    user.role = targetRole;
    await user.save();

    console.log(`✅ User ${user.name} (${user.email}) updated from ${oldRole} ➔ ${targetRole}`);
    console.log('👉 Please LOG OUT and LOG IN again in your browser to refresh your session token.');
  } catch (err) {
    console.error('Error updating role:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

setRole();
