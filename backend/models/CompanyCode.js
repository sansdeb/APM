// models/CompanyCode.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const CompanyCode = sequelize.define('CompanyCode', {
  code:       { type: DataTypes.STRING(20),  allowNull: false, unique: true },
  entityName: { type: DataTypes.STRING(150), allowNull: false },
  
  
  
}, {
  tableName:   'company_codes',
  timestamps:  false,
  underscored: true,
});

module.exports = CompanyCode;