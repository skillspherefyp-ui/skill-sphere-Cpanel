const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AIStudentMemory = sequelize.define('AIStudentMemory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'courses', key: 'id' },
  },
  topicId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'topics', key: 'id' },
  },
  lectureId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'ai_lectures', key: 'id' },
  },
  memoryType: {
    type: DataTypes.ENUM('weakness', 'strength', 'confusion', 'mastery', 'question_pattern'),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  keyTerms: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  sourceType: {
    type: DataTypes.ENUM('quiz_failure', 'quiz_pass', 'repeated_question', 'question_asked'),
    allowNull: false,
  },
  confidence: {
    type: DataTypes.FLOAT,
    defaultValue: 0.8,
  },
}, {
  tableName: 'ai_student_memories',
  indexes: [
    { fields: ['userId', 'courseId'] },
    { fields: ['userId', 'topicId'] },
  ],
});

module.exports = AIStudentMemory;
