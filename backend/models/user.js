

const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const User = sequelize.define('User', {

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // Employee ID — unique identifier given by the company
  employeeId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  password: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

 

  role: {
    type: DataTypes.ENUM('requester', 'approver', 'fa_team', 'taxation'),
    allowNull: false,
    defaultValue: 'requester',
  },

}, {
  tableName:   'users',
  timestamps:  true,
  underscored: true, 
});

module.exports = User;
