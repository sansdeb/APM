// models/AssetCategory.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const AssetCategory = sequelize.define('AssetCategory', {
  
  
  
  label: { type: DataTypes.STRING, allowNull: false, unique: true },
}, {
  tableName:   'asset_categories',
  timestamps:  false,
  underscored: true,
});

module.exports = AssetCategory;