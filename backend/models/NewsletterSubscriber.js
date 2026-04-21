const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NewsletterSubscriber = sequelize.define('NewsletterSubscriber', {
  id:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
}, {
  tableName: 'NewsletterSubscribers',
  timestamps: true,
});

module.exports = NewsletterSubscriber;
