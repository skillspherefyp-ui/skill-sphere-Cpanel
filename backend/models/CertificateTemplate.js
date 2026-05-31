const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CertificateTemplate = sequelize.define('CertificateTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Default Template'
  },
  // NOTE: No logoImage or backgroundImage field - logo is automatic from assets; background uses backgroundColor
  instructorSignature: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Instructor handwritten signature as base64 PNG (transparent background)'
  },
  primaryColor: {
    type: DataTypes.STRING(20),
    defaultValue: '#C9A84C'
  },
  secondaryColor: {
    type: DataTypes.STRING(20),
    defaultValue: '#7EC8E3'
  },
  backgroundColor: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Background color used when no background image is set'
  },
  fontFamily: {
    type: DataTypes.STRING(100),
    defaultValue: 'Arial, sans-serif'
  },
  titleText: {
    type: DataTypes.STRING,
    defaultValue: 'Certificate of Completion'
  },
  subtitleText: {
    type: DataTypes.STRING,
    defaultValue: 'This is to certify that'
  },
  footerText: {
    type: DataTypes.TEXT,
    defaultValue: 'This certificate is awarded upon successful completion of the course requirements.'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'certificate_templates',
  timestamps: true
});

module.exports = CertificateTemplate;
