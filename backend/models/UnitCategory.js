// models/UnitCategory.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const UnitCategory = sequelize.define('UnitCategory', {
  
  
  
  label: { type: DataTypes.STRING, allowNull: false, unique: true },
}, {
  tableName:   'unit_categories',
  timestamps:  false,
  underscored: true,
});

module.exports = UnitCategory;