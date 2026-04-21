const { sequelize } = require('../config/database');
require('dotenv').config();

/**
 * Quick fix to update database schema for Instructor -> User migration
 */

async function quickFix() {
  try {
    console.log('🔧 Quick Fix: Updating database schema...\n');

    // Check if courses table has instructorId column
    const [columns] = await sequelize.query(
      "SHOW COLUMNS FROM courses LIKE 'instructorId'"
    );

    if (columns.length > 0) {
      console.log('📋 Found instructorId column, updating to userId...');

      // Add userId column
      await sequelize.query(`
        ALTER TABLE courses
        ADD COLUMN userId INT AFTER categoryId
      `).catch(err => {
        if (err.message.includes('Duplicate column')) {
          console.log('✓ userId column already exists');
        } else {
          throw err;
        }
      });

      // Copy data from instructorId to userId
      await sequelize.query(`
        UPDATE courses SET userId = instructorId WHERE userId IS NULL
      `);

      console.log('✓ Data copied from instructorId to userId');

      // Create users table if doesn't exist and migrate instructors data
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(255),
          role ENUM('student', 'expert', 'instructor', 'admin') DEFAULT 'student',
          isActive TINYINT(1) DEFAULT 1,
          profilePicture VARCHAR(255),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      console.log('✓ Users table created');

      // Check if instructors table exists
      const [instructorTables] = await sequelize.query(
        "SHOW TABLES LIKE 'instructors'"
      );

      if (instructorTables.length > 0) {
        // Migrate instructor data to users table
        await sequelize.query(`
          INSERT IGNORE INTO users (id, name, email, password, role, isActive, createdAt, updatedAt)
          SELECT id, name, email, password, role, isActive, createdAt, updatedAt
          FROM instructors
        `);

        console.log('✓ Instructor data migrated to users table');
      }

      // Drop all foreign key constraints related to instructorId
      try {
        // Try different constraint names
        const constraintNames = ['courses_ibfk_2', 'fk_courses_instructor', 'courses_instructorId_fkey'];

        for (const constraintName of constraintNames) {
          try {
            await sequelize.query(`
              ALTER TABLE courses DROP FOREIGN KEY ${constraintName}
            `);
            console.log(`✓ Dropped foreign key constraint: ${constraintName}`);
          } catch (err) {
            // Constraint doesn't exist, continue
          }
        }
      } catch (err) {
        console.log('✓ Checked for foreign key constraints');
      }

      // Drop instructorId column
      await sequelize.query(`
        ALTER TABLE courses DROP COLUMN instructorId
      `);

      console.log('✓ Dropped instructorId column');

      // Add foreign key for userId
      await sequelize.query(`
        ALTER TABLE courses
        ADD CONSTRAINT fk_course_user
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      `).catch(err => {
        if (err.message.includes('Duplicate key')) {
          console.log('✓ Foreign key already exists');
        } else {
          throw err;
        }
      });

      console.log('✓ Added foreign key constraint for userId');
    } else {
      console.log('✓ Database already up to date (no instructorId column found)');
    }

    console.log('\n🎉 Database schema updated successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart the server');
    console.log('2. Try creating a course again');

    process.exit(0);
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
    console.log('\nTry running the full migration instead:');
    console.log('node scripts/migrateInstructorToUser.js');
    process.exit(1);
  }
}

quickFix();
