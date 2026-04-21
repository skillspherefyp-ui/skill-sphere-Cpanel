const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Instructor = sequelize.define('Instructor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'instructor', 'expert'),
    allowNull: false,
    defaultValue: 'instructor'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'instructors',
  hooks: {
    beforeCreate: async (instructor) => {
      if (instructor.password) {
        instructor.password = await bcrypt.hash(instructor.password, 10);
      }
    },
    beforeUpdate: async (instructor) => {
      if (instructor.changed('password')) {
        instructor.password = await bcrypt.hash(instructor.password, 10);
      }
    }
  }
});

// Instance method to compare password
Instructor.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = Instructor;



