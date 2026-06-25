require('dotenv').config();
const { sequelize, testConnection } = require('../config/database');
const User = require('../models/User');
const { sendSuperInstructorWelcomeEmail } = require('../services/emailService');

const seedSuperInstructor = async () => {
  try {
    // Test connection (this will also create database if needed)
    await testConnection();

    // Sync models (create tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('✅ Database synced - tables created');

    const superInstructorEmail = process.env.SUPER_INSTRUCTOR_EMAIL || 'skillspherefyp@gmail.com';
    const superInstructorPassword = process.env.SUPER_INSTRUCTOR_PASSWORD || 'skillsphere@123';

    // Check if admin already exists
    const existingSuperInstructor = await User.findOne({
      where: { email: superInstructorEmail }
    });

    if (existingSuperInstructor) {
      console.log('ℹ️  Super instructor already exists');
      console.log(`   Email: ${existingSuperInstructor.email}`);
      console.log(`   Role: ${existingSuperInstructor.role}`);
      process.exit(0);
    }

    // Create admin
    const superInstructor = await User.create({
      name: 'Admin',
      email: superInstructorEmail,
      password: superInstructorPassword,
      role: 'admin',
      isActive: true
    });

    console.log('✅ Super instructor created successfully!');
    console.log(`   Email: ${superInstructor.email}`);
    console.log(`   Password: ${superInstructorPassword}`);
    console.log(`   Role: ${superInstructor.role}`);

    // Send welcome email to admin
    console.log('\n📧 Sending welcome email to admin...');
    try {
      await sendSuperInstructorWelcomeEmail(
        superInstructor.email,
        superInstructor.name,
        superInstructorPassword
      );
      console.log('✅ Welcome email sent successfully!');
    } catch (emailError) {
      console.log('⚠️  Could not send welcome email:', emailError.message);
      console.log('   (Super instructor account was still created)');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedSuperInstructor();

