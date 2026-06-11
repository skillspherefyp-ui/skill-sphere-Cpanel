require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DB,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD || null,
  { host: process.env.MYSQL_HOST, dialect: 'mysql', logging: false }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    const [rows] = await sequelize.query(
      `SELECT id, email, role FROM users WHERE email = ? LIMIT 1`,
      { replacements: [process.env.ADMIN_EMAIL] }
    );

    if (rows.length === 0) {
      await sequelize.query(
        `INSERT INTO users (name, email, password, role, isActive, emailVerified, authProvider, createdAt, updatedAt)
         VALUES (?, ?, ?, 'admin', 1, 1, 'local', NOW(), NOW())`,
        { replacements: [process.env.ADMIN_NAME || 'Admin', process.env.ADMIN_EMAIL, hash] }
      );
      console.log('Admin created:', process.env.ADMIN_EMAIL);
    } else {
      await sequelize.query(
        `UPDATE users SET password = ?, role = 'admin', isActive = 1, emailVerified = 1 WHERE email = ?`,
        { replacements: [hash, process.env.ADMIN_EMAIL] }
      );
      console.log('Admin password reset:', process.env.ADMIN_EMAIL);
    }

    console.log('Done. Login with:', process.env.ADMIN_EMAIL, '/', process.env.ADMIN_PASSWORD);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
