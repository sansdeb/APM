// models/UqcCode.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const UqcCode = sequelize.define('UqcCode', {
  
  
  code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  
}, {
  tableName:   'uqc_codes',
  timestamps:  false,
  underscored: true,
});

module.exports = UqcCode;