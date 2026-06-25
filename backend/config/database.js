const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Create database if it doesn't exist
const createDatabaseIfNotExists = async () => {
  try {
    // Connect to MySQL without specifying database
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();
    console.log(`✅ Database '${process.env.MYSQL_DB}' is ready`);
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  }
};

// Initialize Sequelize - supports both connection URL and individual credentials
const dialectOptions = {
  charset: 'utf8mb4',
  // Note: the server's max_allowed_packet is raised at startup via SET GLOBAL
  // (see testConnection) so loading a full lecture's long-text sections never
  // trips "Got a packet bigger than 'max_allowed_packet'".
};

const sequelize = process.env.MYSQL_URL
  ? new Sequelize(process.env.MYSQL_URL, {
      dialect: 'mysql',
      dialectOptions,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    })
  : new Sequelize(
      process.env.MYSQL_DB,
      process.env.MYSQL_USER,
      process.env.MYSQL_PASSWORD,
      {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        dialect: 'mysql',
        dialectOptions,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

// Test the connection
const testConnection = async () => {
  try {
    // First, ensure database exists (skip if using MYSQL_URL from Railway)
    if (!process.env.MYSQL_URL) {
      await createDatabaseIfNotExists();
    }

    // Then test connection
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');

    // Best-effort: raise the server's max_allowed_packet so loading a full
    // lecture (many long-text sections) never trips the packet limit. Needs
    // SUPER privilege (local root has it); silently skipped on managed hosts.
    try {
      await sequelize.query('SET GLOBAL max_allowed_packet = 67108864');
      console.log('✅ max_allowed_packet raised to 64MB for this MySQL server.');
    } catch (e) {
      console.warn('⚠️  Could not raise max_allowed_packet automatically (no SUPER privilege). If you hit packet errors, set max_allowed_packet=64M in my.ini and restart MySQL.');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = { sequelize, testConnection };
