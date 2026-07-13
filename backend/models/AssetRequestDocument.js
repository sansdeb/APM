// models/AssetRequestDocument.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const AssetRequestDocument = sequelize.define('AssetRequestDocument', {
  assetRequestId: { type: DataTypes.INTEGER, allowNull: false },
  docType:        { type: DataTypes.STRING(20), allowNull: false },
  originalName:   { type: DataTypes.STRING(255), allowNull: false },
  storedPath:     { type: DataTypes.TEXT, allowNull: false },
  uploadedAt:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  uploadedByRole: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'requestor' },
  uploadedBy:     { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName:   'asset_request_documents',
  timestamps:  false,
  underscored: true,
});

module.exports = AssetRequestDocument;