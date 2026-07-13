// models/TaxType.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const TaxType = sequelize.define('TaxType', {
  
  label:   { type: DataTypes.STRING(50), allowNull: false, unique: true },
  gstRate: { type: DataTypes.DECIMAL(5,2), allowNull: true },
  
  
}, {
  tableName:   'tax_types',
  timestamps:  false,
  underscored: true,
});

module.exports = TaxType;