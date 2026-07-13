// models/DocumentType.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const DocumentType = sequelize.define('DocumentType', {
  
  
  
  label: { type: DataTypes.STRING, allowNull: false, unique: true },
}, {
  tableName:   'document_types',
  timestamps:  false,
  underscored: true,
});

module.exports = DocumentType;