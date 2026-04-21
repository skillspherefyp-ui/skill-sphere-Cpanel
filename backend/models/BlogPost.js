const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BlogPost = sequelize.define('BlogPost', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title:       { type: DataTypes.STRING,  allowNull: false },
  excerpt:     { type: DataTypes.TEXT,    allowNull: false },
  content:     { type: DataTypes.TEXT,    allowNull: false },
  tag:         { type: DataTypes.STRING,  defaultValue: 'General' },
  tagColor:    { type: DataTypes.STRING,  defaultValue: '#F68B3C' },
  author:      { type: DataTypes.STRING,  defaultValue: 'SkillSphere Team' },
  readTime:    { type: DataTypes.STRING,  defaultValue: '3 min read' },
  coverIcon:   { type: DataTypes.STRING,  defaultValue: 'newspaper-outline' },
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: false },
  publishedAt: { type: DataTypes.DATE,    allowNull: true },
}, {
  tableName: 'BlogPosts',
  timestamps: true,
});

module.exports = BlogPost;
