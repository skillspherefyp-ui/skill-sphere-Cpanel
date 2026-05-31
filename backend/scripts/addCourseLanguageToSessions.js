/**
 * Fix 3 migration: add courseLanguage column to ai_tutor_sessions
 * and back-fill existing rows from the courses table.
 *
 * Run ONCE before deploying the updated AITutorSession model:
 *   node backend/scripts/addCourseLanguageToSessions.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../config/database');

async function run() {
  const q = sequelize.getQueryInterface();
  const dialect = sequelize.getDialect();

  // 1. Add the column if it doesn't exist yet
  try {
    await q.addColumn('ai_tutor_sessions', 'courseLanguage', {
      type: dialect === 'mysql' ? 'VARCHAR(20)' : 'VARCHAR(20)',
      allowNull: false,
      defaultValue: 'English'
    });
    console.log('Column courseLanguage added to ai_tutor_sessions.');
  } catch (err) {
    if (/duplicate column|already exists/i.test(err.message)) {
      console.log('Column courseLanguage already exists — skipping ADD.');
    } else {
      throw err;
    }
  }

  // 2. Back-fill existing sessions with the correct language from courses
  const [updated] = await sequelize.query(`
    UPDATE ai_tutor_sessions s
    JOIN courses c ON s.courseId = c.id
    SET s.courseLanguage = c.language
    WHERE s.courseLanguage = 'English' OR s.courseLanguage IS NULL
  `);
  console.log(`Back-filled courseLanguage for ${updated} existing sessions.`);

  await sequelize.close();
  console.log('Migration complete.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
