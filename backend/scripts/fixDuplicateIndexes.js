const { sequelize } = require('../models');

async function fix() {
  const [rows] = await sequelize.query('SHOW INDEX FROM users;');

  // Keep only the first occurrence of each key name + PRIMARY
  const keep = new Set(['PRIMARY', 'email', 'googleId', 'users_email_unique', 'users_google_id_unique']);
  const seen = new Set();
  const toDrop = [];

  for (const r of rows) {
    if (keep.has(r.Key_name) && !seen.has(r.Key_name)) {
      seen.add(r.Key_name);
      continue;
    }
    if (!seen.has(r.Key_name)) {
      seen.add(r.Key_name);
      continue;
    }
    toDrop.push(r.Key_name);
  }

  // Also drop old-style unnamed duplicates (email_2, email_3, googleId_2, etc.)
  for (const r of rows) {
    if (/^(email|googleId)_\d+$/.test(r.Key_name)) {
      toDrop.push(r.Key_name);
    }
  }

  const unique = [...new Set(toDrop)];
  if (unique.length === 0) {
    console.log('No duplicate indexes found.');
    process.exit(0);
  }

  console.log('Dropping', unique.length, 'duplicate indexes...');
  for (const idx of unique) {
    try {
      await sequelize.query('DROP INDEX `' + idx + '` ON users;');
      console.log('Dropped:', idx);
    } catch (e) {
      console.warn('Could not drop', idx, '-', e.message);
    }
  }

  const [after] = await sequelize.query('SHOW INDEX FROM users;');
  console.log('\nRemaining indexes (' + after.length + '):');
  after.forEach(r => console.log(' ', r.Key_name, '->', r.Column_name));
  process.exit(0);
}

fix().catch(e => { console.error(e.message); process.exit(1); });
