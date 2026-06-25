const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DiscussionPost = sequelize.define('DiscussionPost', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  courseId: { type: DataTypes.INTEGER, allowNull: true },
  topicId: { type: DataTypes.INTEGER, allowNull: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  parentId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
  isPinned: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'discussion_posts' });

module.exports = DiscussionPost;
