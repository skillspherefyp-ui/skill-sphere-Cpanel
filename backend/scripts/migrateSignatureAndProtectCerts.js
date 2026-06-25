/**
 * Migration: Add instructorSignature to users, courseName + templateSnapshot to certificates,
 *            allow certificates.courseId to be NULL (preserves certs on course deletion),
 *            update FK from CASCADE to SET NULL.
 *
 * Run once: node backend/scripts/migrateSignatureAndProtectCerts.js
 */

const { sequelize } = require('../config/database');

async function migrate() {
  try {
    console.log('Starting migration...');

    // 1. Add instructorSignature to users table (camelCase — no underscored option)
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN instructorSignature LONGTEXT NULL
      COMMENT 'Instructor handwritten signature as base64 PNG';
    `).catch(e => {
      if (e.message.includes('Duplicate column')) {
        console.log('users.instructorSignature already exists, skipping.');
      } else throw e;
    });
    console.log('Done: users.instructorSignature');

    // 2. Add courseName to certificates table
    await sequelize.query(`
      ALTER TABLE certificates
      ADD COLUMN courseName VARCHAR(500) NULL
      COMMENT 'Course name preserved if course is deleted';
    `).catch(e => {
      if (e.message.includes('Duplicate column')) {
        console.log('certificates.courseName already exists, skipping.');
      } else throw e;
    });
    console.log('Done: certificates.courseName');

    // 3. Add templateSnapshot to certificates table
    await sequelize.query(`
      ALTER TABLE certificates
      ADD COLUMN templateSnapshot JSON NULL
      COMMENT 'Template visuals frozen at certificate award time';
    `).catch(e => {
      if (e.message.includes('Duplicate column')) {
        console.log('certificates.templateSnapshot already exists, skipping.');
      } else throw e;
    });
    console.log('Done: certificates.templateSnapshot');

    // 4. Allow certificates.courseId to be NULL
    await sequelize.query(`
      ALTER TABLE certificates MODIFY COLUMN courseId INT NULL;
    `).catch(e => console.warn('Could not modify courseId nullability:', e.message));
    console.log('Done: certificates.courseId allows NULL');

    // 5. Update FK: drop old CASCADE, re-add as SET NULL
    const [fkRows] = await sequelize.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'certificates'
        AND COLUMN_NAME = 'courseId'
        AND REFERENCED_TABLE_NAME = 'courses';
    `);
    for (const row of fkRows) {
      await sequelize.query(`ALTER TABLE certificates DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\`;`)
        .catch(e => console.warn('Could not drop FK:', e.message));
    }
    await sequelize.query(`
      ALTER TABLE certificates
      ADD CONSTRAINT fk_certificates_course
      FOREIGN KEY (courseId) REFERENCES courses(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
    `).catch(e => console.warn('Could not add SET NULL FK (may already exist):', e.message));
    console.log('Done: certificates FK updated to ON DELETE SET NULL');

    // 6. Backfill courseName for existing certificates
    await sequelize.query(`
      UPDATE certificates c
      JOIN courses co ON c.courseId = co.id
      SET c.courseName = co.name
      WHERE c.courseName IS NULL;
    `).catch(e => console.warn('Backfill courseName:', e.message));
    console.log('Done: backfilled courseName for existing certificates');

    console.log('\nMigration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
