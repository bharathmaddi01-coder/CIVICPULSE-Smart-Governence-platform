// scripts/createDepartmentAccount.js
// Utility script to create a Department and its corresponding Staff account in CivicPulse.
// Usage:
//   node scripts/createDepartmentAccount.js "Department Name" "Department Description" "Staff Name" "staff_email@domain.com" "StaffPassword123"
//
// Example:
//   node scripts/createDepartmentAccount.js "Sanitation & Waste" "Garbage collection and city cleaning" "Inspector Ramesh" "ramesh@sanitation.civic" "Staff@123"

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Department from '../src/models/Department.js';
import User from '../src/models/User.js';

dotenv.config();

async function createDepartmentAccount() {
  const args = process.argv.slice(2);

  const deptName = args[0] || 'Sanitation & Waste Management';
  const deptDesc = args[1] || 'Municipal solid waste management, street sweeping, and garbage disposal';
  const staffName = args[2] || 'Officer Ramesh';
  const staffEmail = (args[3] || 'ramesh.staff@civicpulse.local').toLowerCase().trim();
  const staffPassword = args[4] || 'Password@123';

  console.log('--- CivicPulse Department & Staff Account Generator ---');
  console.log(`Department: "${deptName}"`);
  console.log(`Staff User: "${staffName}" <${staffEmail}>`);

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicpulse');
    console.log('✅ Connected to MongoDB');

    // 1. Find or create the department
    let department = await Department.findOne({ name: deptName });
    if (!department) {
      department = await Department.create({
        name: deptName,
        description: deptDesc,
        active: true,
      });
      console.log(`✅ Department created: ${department.name} (ID: ${department._id})`);
    } else {
      console.log(`ℹ️ Existing department found: ${department.name} (ID: ${department._id})`);
    }

    // 2. Find or create the staff user
    let user = await User.findOne({ email: staffEmail });
    if (user) {
      // Update role and department if already exists
      user.name = staffName;
      user.role = 'STAFF';
      user.department = department._id;
      user.passwordHash = await bcrypt.hash(staffPassword, 10);
      await user.save();
      console.log(`✅ Existing user updated to STAFF assigned to ${department.name}`);
    } else {
      const passwordHash = await bcrypt.hash(staffPassword, 10);
      user = await User.create({
        name: staffName,
        email: staffEmail,
        passwordHash,
        role: 'STAFF',
        department: department._id,
      });
      console.log(`✅ New STAFF user created: ${user.name} (${user.email})`);
    }

    console.log('\n=============================================');
    console.log('🎉 DEPARTMENT ACCOUNT READY TO USE:');
    console.log('---------------------------------------------');
    console.log(`Department Name : ${department.name}`);
    console.log(`Staff Email     : ${staffEmail}`);
    console.log(`Staff Password  : ${staffPassword}`);
    console.log(`Role            : STAFF`);
    console.log('Login URL       : http://localhost:5173/login');
    console.log('=============================================\n');
  } catch (err) {
    console.error('❌ Error creating department/staff account:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createDepartmentAccount();
