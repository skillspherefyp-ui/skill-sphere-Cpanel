require('dotenv').config();
const { sequelize } = require('../config/database');

async function migrateProfilePicture() {
  try {
    const [columns] = await sequelize.query("SHOW COLUMNS FROM users WHERE Field = 'profilePicture'");
    if (columns.length > 0 && columns[0].Type.toLowerCase() !== 'longtext') {
      await sequelize.query('ALTER TABLE users MODIFY COLUMN profilePicture LONGTEXT;');
      console.log('✅ profilePicture column upgraded to LONGTEXT');
    }
  } catch (err) {
    console.error('❌ migrateProfilePicture failed:', err.message);
  }
}

module.exports = migrateProfilePicture;
