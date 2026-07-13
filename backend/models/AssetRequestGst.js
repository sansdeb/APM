const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const AssetRequestGst = sequelize.define('AssetRequestGst', {
  assetRequestId: { type: DataTypes.INTEGER,      allowNull: false },
  gstType:        { type: DataTypes.STRING(10),   allowNull: false },  // IGST / CGST / SGST
  gstRate:        { type: DataTypes.DECIMAL(5,2),  allowNull: false },
  amount:         { type: DataTypes.DECIMAL(15,2), allowNull: false },
}, {
  tableName:   'asset_request_gst',
  timestamps:  false,
  underscored: true,
});

module.exports = AssetRequestGst;