// models/TransactionStatus.js
// Maps to transaction_statuses table.
// Used by AssetRequest (status_id FK) and RequestAuditLog.

const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const TransactionStatus = sequelize.define('TransactionStatus', {
  statusName: {
    type:       DataTypes.STRING(50),
    allowNull:  false,
    unique:     true,
    // Machine key — backend uses this to look up IDs at runtime
    // e.g. TransactionStatus.findOne({ where: { statusName: 'requester_saved' } })
  },
  statusDescription: {
    type:      DataTypes.TEXT,
    allowNull: false,
    // Human label — returned to frontend for display in badges
  },
  active: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
    // false = soft-deleted status, hidden from UI
  },
}, {
  tableName:   'transaction_statuses',
  timestamps:  false,   // no createdAt/updatedAt — statuses don't change
  underscored: true,    // statusName → status_name in DB
});

module.exports = TransactionStatus;