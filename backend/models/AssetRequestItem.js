// models/AssetRequestItem.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const AssetRequestItem = sequelize.define('AssetRequestItem', {
  assetRequestId: { type: DataTypes.INTEGER,      allowNull: false },
  sno:            { type: DataTypes.INTEGER,      allowNull: false },
  description:    { type: DataTypes.TEXT,         allowNull: false },
  uqcCode:        { type: DataTypes.STRING(10),   allowNull: true },
  quantity:       { type: DataTypes.DECIMAL(10,3), allowNull: false },
  rate:           { type: DataTypes.DECIMAL(15,2), allowNull: false },
  // amount is NOT stored — always calculated as quantity * rate
  hsnCode:        { type: DataTypes.STRING(20),   allowNull: true },

  // ── Taxation GST fields (filled by taxation team) ──
  gstRate:        { type: DataTypes.DECIMAL(5,2),  allowNull: true },
  itemRate:       { type: DataTypes.DECIMAL(15,2), allowNull: true },
  taxableValue:   { type: DataTypes.DECIMAL(15,2), allowNull: true },
  gstAmount:      { type: DataTypes.DECIMAL(15,2), allowNull: true },
  totalAmount:    { type: DataTypes.DECIMAL(15,2), allowNull: true },
}, {
  tableName:   'asset_request_items',
  timestamps:  false,
  underscored: true,
});

module.exports = AssetRequestItem;