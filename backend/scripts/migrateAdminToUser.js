const { sequelize } = require('../config/database');
require('dotenv').config();

/**
 * Migration script to transition from Instructor table to User table
 * This script:
 * 1. Migrates data from instructors table to users table
 * 2. Updates courses table to use userId instead of instructorId
 * 3. Creates new student-related tables
 */

async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...');

    // Check if instructors table exists
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'instructors'"
    );

    if (tables.length > 0) {
      console.log('📋 Instructors table found. Starting migration...');

      // Create users table if it doesn't exist
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(255),
          role ENUM('student', 'expert', 'instructor', 'superinstructor') DEFAULT 'student',
          isActive TINYINT(1) DEFAULT 1,
          profilePicture VARCHAR(255),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Users table created');

      // Migrate data from instructors to users
      await sequelize.query(`
        INSERT INTO users (id, name, email, password, role, isActive, createdAt, updatedAt)
        SELECT id, name, email, password, role, isActive, createdAt, updatedAt
        FROM instructors
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.email = instructors.email)
      `);

      console.log('✅ Instructor data migrated to users table');

      // Check if courses table has instructorId column
      const [columns] = await sequelize.query(
        "SHOW COLUMNS FROM courses LIKE 'instructorId'"
      );

      if (columns.length > 0) {
        console.log('📋 Updating courses table...');

        // Add userId column if it doesn't exist
        await sequelize.query(`
          ALTER TABLE courses
          ADD COLUMN IF NOT EXISTS userId INT AFTER categoryId
        `).catch(() => {
          // Column might already exist
          console.log('userId column already exists or cannot be added');
        });

        // Copy data from instructorId to userId
        await sequelize.query(`
          UPDATE courses SET userId = instructorId WHERE userId IS NULL
        `);

        // Drop foreign key constraint on instructorId
        await sequelize.query(`
          ALTER TABLE courses DROP FOREIGN KEY IF EXISTS courses_ibfk_2
        `).catch(() => {
          console.log('Foreign key constraint might not exist');
        });

        // Drop instructorId column
        await sequelize.query(`
          ALTER TABLE courses DROP COLUMN IF EXISTS instructorId
        `).catch(() => {
          console.log('instructorId column might not exist');
        });

        // Add foreign key for userId
        await sequelize.query(`
          ALTER TABLE courses
          ADD CONSTRAINT fk_course_user
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        `).catch(() => {
          console.log('Foreign key constraint might already exist');
        });

        console.log('✅ Courses table updated');
      }

      console.log('📋 Renaming instructors table to instructors_backup...');
      await sequelize.query('RENAME TABLE instructors TO instructors_backup');
      console.log('✅ Instructors table renamed to instructors_backup');
    }

    // Sync all models (creates new tables)
    console.log('📋 Creating student-related tables...');
    await sequelize.sync({ alter: false });
    console.log('✅ All tables synced successfully');

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Login with existing credentials (they have been migrated)');
    console.log('3. You can safely drop instructors_backup table after verifying the migration');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();
