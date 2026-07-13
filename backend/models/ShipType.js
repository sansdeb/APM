// models/ShipType.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const ShipType = sequelize.define('ShipType', {
  
  
  
  label: { type: DataTypes.STRING, allowNull: false, unique: true },
}, {
  tableName:   'ship_types',
  timestamps:  false,
  underscored: true,
});

module.exports = ShipType;