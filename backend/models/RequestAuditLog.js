const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const RequestAuditLog = sequelize.define('RequestAuditLog', {
  assetRequestId: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  fromStatusId: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  toStatusId: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  changedBy: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  comment: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  changedAt: {
    type:         DataTypes.DATE,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName:   'request_audit_log',
  timestamps:  false,
  underscored: true,
});

// ── Associations ──────────────────────────────────────────────
const User              = require('./User');
const TransactionStatus = require('./TransactionStatus');

RequestAuditLog.belongsTo(User,              { foreignKey: 'changedBy',    as: 'changedByUser' });
RequestAuditLog.belongsTo(TransactionStatus, { foreignKey: 'fromStatusId', as: 'fromStatus'    });
RequestAuditLog.belongsTo(TransactionStatus, { foreignKey: 'toStatusId',   as: 'toStatus'      });

module.exports = RequestAuditLog;