const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function addPermissionsColumn() {
  try {
    console.log('🔄 Checking if permissions column exists...');

    // Check if column already exists
    const [results] = await sequelize.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'permissions'`,
      { type: QueryTypes.SELECT }
    );

    if (results) {
      console.log('✅ Permissions column already exists');
      process.exit(0);
    }

    console.log('📝 Adding permissions column to users table...');

    // Add permissions column
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN permissions JSON DEFAULT '{"canManageAllCourses":true,"canManageCategories":true,"canManageStudents":true,"canManageCertificates":true,"canViewFeedback":true}'
    `);

    console.log('✅ Permissions column added successfully!');

    // Update existing instructor and expert users with default permissions
    console.log('📝 Setting default permissions for existing instructors and experts...');

    await sequelize.query(`
      UPDATE users
      SET permissions = '{"canManageAllCourses":true,"canManageCategories":true,"canManageStudents":true,"canManageCertificates":true,"canViewFeedback":true}'
      WHERE role IN ('instructor', 'expert') AND (permissions IS NULL OR permissions = '{}')
    `);

    console.log('✅ Default permissions set for existing users!');
    console.log('✨ Migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addPermissionsColumn();
