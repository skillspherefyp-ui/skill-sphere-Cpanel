const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { sequelize } = require('../config/database');

async function syncCourseColumns() {
  let rows;
  try {
    [rows] = await sequelize.query('SHOW COLUMNS FROM courses');
  } catch (_) {
    // Table doesn't exist yet — sequelize.sync() will create it with all columns
    return;
  }

  const existingColumns = new Set(rows.map((row) => row.Field));

  if (!existingColumns.has('thumbnailImage')) {
    console.log('Adding courses.thumbnailImage...');
    await sequelize.query('ALTER TABLE courses ADD COLUMN thumbnailImage VARCHAR(255) NULL');
  }

  if (!existingColumns.has('creationMode')) {
    console.log('Adding courses.creationMode...');
    await sequelize.query("ALTER TABLE courses ADD COLUMN creationMode ENUM('ai','manual') NOT NULL DEFAULT 'ai'");
  }
}

if (require.main === module) {
  syncCourseColumns()
    .then(async () => {
      console.log('Course columns are in sync.');
      await sequelize.close();
    })
    .catch(async (error) => {
      console.error('Failed to sync course columns:', error);
      await sequelize.close();
      process.exitCode = 1;
    });
}

module.exports = syncCourseColumns;
