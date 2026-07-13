
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const ApproverRequestorMap = sequelize.define('ApproverRequestorMap', {
  approverId:  { type: DataTypes.INTEGER, allowNull: false },
  requestorId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName:   'approver_requestor_map',
  timestamps:  false,
  underscored: true,
});

module.exports = ApproverRequestorMap;