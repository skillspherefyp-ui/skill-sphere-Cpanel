const { sequelize } = require('../config/database');
const { Instructor } = require('../models');

async function addInstructorIdToCourses() {
  try {
    console.log('🔄 Starting migration: Adding instructorId column to courses table...');

    // Check if the column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'instructorId'
    `);

    if (results.length > 0) {
      console.log('✅ instructorId column already exists in courses table');
      process.exit(0);
    }

    // Get the first admin to use as default
    const admin = await Instructor.findOne({ where: { role: 'admin' } });

    if (!admin) {
      console.error('❌ No admin found. Please run seedSuperInstructor.js first.');
      process.exit(1);
    }

    console.log(`📌 Using admin (${admin.email}) as default creator for existing courses`);

    // Add the instructorId column with a default value
    await sequelize.query(`
      ALTER TABLE courses
      ADD COLUMN instructorId INTEGER NOT NULL DEFAULT ${admin.id}
    `);

    console.log('✅ instructorId column added successfully');

    // Add the foreign key constraint
    await sequelize.query(`
      ALTER TABLE courses
      ADD CONSTRAINT fk_courses_instructor
      FOREIGN KEY (instructorId)
      REFERENCES instructors(id)
      ON DELETE CASCADE
    `);

    console.log('✅ Foreign key constraint added successfully');
    console.log('✅ Migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addInstructorIdToCourses();
