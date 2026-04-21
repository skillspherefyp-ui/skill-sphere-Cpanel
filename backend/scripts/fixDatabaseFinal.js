const { sequelize } = require('../config/database');
require('dotenv').config();

async function finalFix() {
  try {
    console.log('🔧 Final Fix: Updating database schema...\n');

    // Step 1: Check current situation
    const [coursesColumns] = await sequelize.query("SHOW COLUMNS FROM courses");
    const hasInstructorId = coursesColumns.some(col => col.Field === 'instructorId');
    const hasUserId = coursesColumns.some(col => col.Field === 'userId');

    console.log(`Current state: instructorId=${hasInstructorId}, userId=${hasUserId}\n`);

    if (!hasInstructorId && hasUserId) {
      console.log('✓ Database already migrated!');
      console.log('Checking foreign key constraints...\n');

      // Fix any orphaned courses
      const [orphanedCourses] = await sequelize.query(`
        SELECT c.id, c.userId
        FROM courses c
        LEFT JOIN users u ON c.userId = u.id
        WHERE u.id IS NULL
      `);

      if (orphanedCourses.length > 0) {
        console.log(`Found ${orphanedCourses.length} courses with invalid userId`);

        // Get first instructor/admin user
        const [firstInstructor] = await sequelize.query(`
          SELECT id FROM users WHERE role IN ('instructor', 'admin') LIMIT 1
        `);

        if (firstInstructor.length > 0) {
          const instructorId = firstInstructor[0].id;
          console.log(`Reassigning orphaned courses to user ID: ${instructorId}`);

          await sequelize.query(`
            UPDATE courses
            SET userId = ?
            WHERE id IN (${orphanedCourses.map(c => c.id).join(',')})
          `, {
            replacements: [instructorId]
          });

          console.log('✓ Orphaned courses reassigned');
        }
      } else {
        console.log('✓ No orphaned courses found');
      }

      // Try to add foreign key constraint
      try {
        await sequelize.query(`
          ALTER TABLE courses
          ADD CONSTRAINT fk_course_user
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        `);
        console.log('✓ Foreign key constraint added');
      } catch (err) {
        if (err.message.includes('Duplicate key')) {
          console.log('✓ Foreign key constraint already exists');
        } else {
          throw err;
        }
      }

      console.log('\n🎉 Database is ready!');
      console.log('\n Restart your server and try creating a course.');
      process.exit(0);
    }

    // If we still have instructorId, do the migration
    if (hasInstructorId) {
      console.log('Starting migration from instructorId to userId...\n');

      // Create users table
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

      // Migrate instructors to users
      const [instructorTables] = await sequelize.query("SHOW TABLES LIKE 'instructors'");
      if (instructorTables.length > 0) {
        await sequelize.query(`
          INSERT IGNORE INTO users (id, name, email, password, role, isActive, createdAt, updatedAt)
          SELECT id, name, email, password, role, isActive, createdAt, updatedAt
          FROM instructors
        `);
        console.log('✓ Instructor data migrated to users');
      }

      // Add userId column if doesn't exist
      if (!hasUserId) {
        await sequelize.query(`
          ALTER TABLE courses ADD COLUMN userId INT AFTER categoryId
        `);
        console.log('✓ userId column added');
      }

      // Copy instructorId to userId
      await sequelize.query(`
        UPDATE courses SET userId = instructorId WHERE userId IS NULL OR userId = 0
      `);
      console.log('✓ Data copied from instructorId to userId');

      // Drop foreign key constraints
      const constraintNames = ['courses_ibfk_2', 'fk_courses_instructor', 'courses_instructorId_fkey'];
      for (const constraintName of constraintNames) {
        try {
          await sequelize.query(`ALTER TABLE courses DROP FOREIGN KEY ${constraintName}`);
          console.log(`✓ Dropped constraint: ${constraintName}`);
        } catch (err) {
          // Constraint doesn't exist
        }
      }

      // Drop instructorId column
      await sequelize.query(`ALTER TABLE courses DROP COLUMN instructorId`);
      console.log('✓ instructorId column dropped');

      // Add foreign key
      await sequelize.query(`
        ALTER TABLE courses
        ADD CONSTRAINT fk_course_user
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('✓ Foreign key constraint added');

      console.log('\n🎉 Migration completed!');
      console.log('\nRestart your server and try creating a course.');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    console.log('\nManual SQL commands to fix:');
    console.log('1. Check foreign keys: SHOW CREATE TABLE courses;');
    console.log('2. Drop all foreign keys related to instructorId');
    console.log('3. Drop instructorId column: ALTER TABLE courses DROP COLUMN instructorId;');
    console.log('4. Add foreign key: ALTER TABLE courses ADD CONSTRAINT fk_course_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;');
    process.exit(1);
  }
}

finalFix();
