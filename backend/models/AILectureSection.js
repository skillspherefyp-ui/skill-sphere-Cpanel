const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AILectureSection = sequelize.define('AILectureSection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lectureId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ai_lectures',
      key: 'id'
    }
  },
  sectionIndex: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  chunkIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  chunkText: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  learningObjective: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  spokenExplanation: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  whiteboardExplanation: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  keyTerms: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const v = this.getDataValue('keyTerms');
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
      return [];
    }
  },
  examples: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const v = this.getDataValue('examples');
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
      return [];
    }
  },
  analogyIfHelpful: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  visualMode: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'none'
  },
  visualQuery: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  visualCaption: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  visualSuggestion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  whiteboardSuggestion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  slideBullets: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const v = this.getDataValue('slideBullets');
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
      return [];
    }
  },
  teachingSequence: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const v = this.getDataValue('teachingSequence');
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
      return [];
    }
  },
  difficultyLevel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estimatedDurationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 45
  },
  checkpointQuestion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  visualData: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    get() {
      const v = this.getDataValue('visualData');
      if (v && typeof v === 'object' && !Array.isArray(v)) return v;
      if (typeof v === 'string') { try { return JSON.parse(v) || {}; } catch { return {}; } }
      return {};
    }
  },
  diagramData: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    get() {
      const v = this.getDataValue('diagramData');
      if (!v) return null;
      if (typeof v === 'object' && !Array.isArray(v)) return v;
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
      return null;
    }
  }
}, {
  tableName: 'ai_lecture_sections',
  indexes: [
    {
      fields: ['lectureId', 'sectionIndex', 'chunkIndex']
    }
  ]
});

module.exports = AILectureSection;
