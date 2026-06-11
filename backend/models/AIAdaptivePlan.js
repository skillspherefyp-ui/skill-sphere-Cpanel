const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AIAdaptivePlan = sequelize.define('AIAdaptivePlan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'courses', key: 'id' },
  },
  topicId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'topics', key: 'id' },
  },
  lectureId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'ai_lectures', key: 'id' },
  },
  triggerType: {
    type: DataTypes.ENUM('quiz_failure', 'low_engagement', 'repeated_confusion'),
    defaultValue: 'quiz_failure',
  },
  weakAreas: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  revisionChunks: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('pending', 'ready', 'completed'),
    defaultValue: 'pending',
  },
  quizScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'ai_adaptive_plans',
  indexes: [
    { fields: ['userId', 'topicId'] },
  ],
});

module.exports = AIAdaptivePlan;
