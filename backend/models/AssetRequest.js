// models/AssetRequest.js
// All asset detail fields are allowNull: true so Save works with partial data.
// Validation of required fields is enforced in the controller (submitRequest),
// not at the DB model level — this gives us the Save vs Submit behaviour.

const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const AssetRequest = sequelize.define('AssetRequest', {

  requesterId:     { type: DataTypes.INTEGER,       allowNull: false },
  requestNo:       { type: DataTypes.STRING(20),    allowNull: false, unique: true },
  statusId:        { type: DataTypes.INTEGER,       allowNull: false },

  // Asset Details — all nullable so Save accepts partial form
  salesTypeId:     { type: DataTypes.INTEGER,       allowNull: true },
  assetCategoryId: { type: DataTypes.INTEGER,       allowNull: true },
  companyCodeId:   { type: DataTypes.INTEGER,       allowNull: true },
  companyCodeLabel:{ type: DataTypes.STRING(200),   allowNull: true }, // "5320  Axon"
  unitCategoryId:  { type: DataTypes.INTEGER,       allowNull: true },
  categoryOfUnits: { type: DataTypes.STRING(50),    allowNull: true }, // "SEZ"
  entityName:      { type: DataTypes.STRING(150),   allowNull: true },
  assetLocation:   { type: DataTypes.STRING(150),   allowNull: true },
  grossValue:      { type: DataTypes.DECIMAL(15,2), allowNull: true },
  wdv:             { type: DataTypes.DECIMAL(15,2), allowNull: true },
  costCenter:      { type: DataTypes.STRING(50),    allowNull: true },
  salesValue:      { type: DataTypes.DECIMAL(15,2), allowNull: true },

  // Phase 3
  documentTypeId:  { type: DataTypes.INTEGER,       allowNull: true },
  taxTypeId:       { type: DataTypes.INTEGER,       allowNull: true },

  // Phase 5
  comments:        { type: DataTypes.TEXT,          allowNull: true },

  // Workflow
  submittedAt:      { type: DataTypes.DATE,    allowNull: true },
  approvedBy:       { type: DataTypes.INTEGER, allowNull: true },
  rejectionReason:  { type: DataTypes.TEXT,    allowNull: true },
  approverComments: { type: DataTypes.TEXT,    allowNull: true },
  faDraftComment:   { type: DataTypes.TEXT,    allowNull: true },
  

  // Consigner
  consignerName:     { type: DataTypes.STRING(150), allowNull: true },
  consignerAddress:  { type: DataTypes.TEXT,        allowNull: true },
  consignerPincode:  { type: DataTypes.STRING(10),  allowNull: true },
  consignerLocation: { type: DataTypes.STRING(100), allowNull: true },
  plantCode:         { type: DataTypes.STRING(50),  allowNull: true },
  consignerGstin:    { type: DataTypes.STRING(20),  allowNull: true },

  // Consignee
  consigneeName:            { type: DataTypes.STRING(150), allowNull: true },
  consigneeAddress:         { type: DataTypes.TEXT,        allowNull: true },
  consigneePincode:         { type: DataTypes.STRING(10),  allowNull: true },
  consigneeLocation:        { type: DataTypes.STRING(100), allowNull: true },
  consigneeGstin:           { type: DataTypes.STRING(20),  allowNull: true },
  consigneeCategoryOfUnits: { type: DataTypes.STRING(50),  allowNull: true },
  consigneePlantCode:       { type: DataTypes.STRING(50),  allowNull: true },
  consigneeCostCentre:      { type: DataTypes.STRING(50),  allowNull: true },

  // Ship To
  shipToName:    { type: DataTypes.STRING(150), allowNull: true },
  shipToAddress: { type: DataTypes.TEXT,        allowNull: true },
  shipToGstin:   { type: DataTypes.STRING(20),  allowNull: true },
  type:          { type: DataTypes.STRING(100), allowNull: true },

  // Taxation — THESE WERE MISSING
  taxInvoiceNo:     { type: DataTypes.STRING(50), allowNull: true },
  taxInvoiceDate:   { type: DataTypes.DATE,       allowNull: true },
  taxationComments: { type: DataTypes.TEXT,       allowNull: true },
  isValidated:      { type: DataTypes.BOOLEAN,    allowNull: false, defaultValue: false },


  // Soft delete
  deletedAt:       { type: DataTypes.DATE,          allowNull: true },

}, {
  tableName:   'asset_requests',
  timestamps:  true,
  underscored: true,
});

// ── Associations ──────────────────────────────────────────────
const User              = require('./User');
const TransactionStatus = require('./TransactionStatus');
const AssetCategory     = require('./AssetCategory');
const CompanyCode       = require('./CompanyCode');
const SalesType         = require('./SalesType');
const UnitCategory      = require('./UnitCategory');
const DocumentType      = require('./DocumentType');
const TaxType           = require('./TaxType');

AssetRequest.belongsTo(User,              { foreignKey: 'requesterId',    as: 'requester'     });
AssetRequest.belongsTo(TransactionStatus, { foreignKey: 'statusId',       as: 'status'        });
AssetRequest.belongsTo(SalesType,         { foreignKey: 'salesTypeId',    as: 'salesType'     });
AssetRequest.belongsTo(AssetCategory,     { foreignKey: 'assetCategoryId',as: 'assetCategory' });
AssetRequest.belongsTo(CompanyCode,       { foreignKey: 'companyCodeId',  as: 'companyCode'   });
AssetRequest.belongsTo(UnitCategory,      { foreignKey: 'unitCategoryId', as: 'unitCategory'  });
AssetRequest.belongsTo(DocumentType,      { foreignKey: 'documentTypeId', as: 'documentType'  });
AssetRequest.belongsTo(TaxType,           { foreignKey: 'taxTypeId',      as: 'taxType'       });

// Line items
const AssetRequestItem = require('./AssetRequestItem');
AssetRequest.hasMany(AssetRequestItem, { foreignKey: 'assetRequestId', as: 'items' });

// Uploaded documents
const AssetRequestDocument = require('./AssetRequestDocument');
AssetRequest.hasMany(AssetRequestDocument, { foreignKey: 'assetRequestId', as: 'documents' });
// GST breakdown rows (taxation)
const AssetRequestGst = require('./AssetRequestGst');
AssetRequest.hasMany(AssetRequestGst, { foreignKey: 'assetRequestId', as: 'gstRows' });

module.exports = AssetRequest;