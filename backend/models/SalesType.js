// models/SalesType.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const SalesType = sequelize.define('SalesType', {
  
  
  
  label: { type: DataTypes.STRING, allowNull: false, unique: true },
}, {
  tableName:   'sales_types',
  timestamps:  false,
  underscored: true,
});

module.exports = SalesType;