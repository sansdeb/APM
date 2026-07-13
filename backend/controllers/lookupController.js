// controllers/lookupController.js
//
// PURPOSE: serve all dropdown data to the frontend.
// Every function here is a GET — no data is ever written
// through these endpoints. Lookup tables are seeded once via SQL.
//
// ENDPOINTS (mounted at /api/lookups in server.js):
//   GET /api/lookups/all                          → all dropdowns in one call
//   GET /api/lookups/sales-types                  → sales type options
//   GET /api/lookups/asset-categories             → category options
//   GET /api/lookups/asset-categories/:id/company-codes → dependent dropdown
//   GET /api/lookups/unit-categories              → unit options
//   GET /api/lookups/ship-types                   → ship type options
//   GET /api/lookups/document-types               → document type options
//   GET /api/lookups/tax-types                    → tax type options (+ gst_rate)
//   GET /api/lookups/uqc-codes                    → UQC options for line items
//   GET /api/lookups/statuses                     → transaction statuses

const SalesType          = require('../models/SalesType');
const AssetCategory      = require('../models/AssetCategory');
const CompanyCode        = require('../models/CompanyCode');
const UnitCategory       = require('../models/UnitCategory');
const ShipType           = require('../models/ShipType');
const DocumentType       = require('../models/DocumentType');
const TaxType            = require('../models/TaxType');
const UqcCode            = require('../models/UqcCode');
const TransactionStatus  = require('../models/TransactionStatus');
const sequelize          = require('../config/db');

// ─── HELPER ──────────────────────────────────────────────────
// All lookup tables follow the same pattern: findAll, return rows.
// This wrapper keeps each function to 3 lines.
const fetchAll = (Model, options = {}) => async (req, res) => {
  try {
    const rows = await Model.findAll(options);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load lookup data' });
  }
};

// ─── INDIVIDUAL ENDPOINTS ────────────────────────────────────

// Sales types: Sale, Scrap, Transfer
exports.getSalesTypes = fetchAll(SalesType, { order: [['label', 'ASC']] });

// Asset categories: IT Assets, Furniture, Vehicles…
exports.getAssetCategories = fetchAll(AssetCategory, { order: [['label', 'ASC']] });

// Unit categories: Units, Nos, Kgs, Ltrs, Mtrs
exports.getUnitCategories = fetchAll(UnitCategory, { order: [['label', 'ASC']] });

// Ship types: Domestic, Export, Import
exports.getShipTypes = fetchAll(ShipType, { order: [['label', 'ASC']] });

// Document types: Invoice, Delivery Challan…
exports.getDocumentTypes = fetchAll(DocumentType, { order: [['label', 'ASC']] });

// Tax types — includes gst_rate so frontend can show correct breakdown
// gst_rate is NULL for non-GST types
exports.getTaxTypes = fetchAll(TaxType, { order: [['label', 'ASC']] });

// UQC codes for line items: BAG, BOX, KGS…
exports.getUqcCodes = fetchAll(UqcCode, { order: [['code', 'ASC']] });

// Active transaction statuses only — inactive ones are hidden from UI
exports.getStatuses = fetchAll(TransactionStatus, {
  where:  { active: true },
  order:  [['id', 'ASC']],
});

// All company codes — used by dashboard to build label→id map
exports.getAllCompanyCodes = async (req, res) => {
  try {
    const rows = await CompanyCode.findAll({ order: [['code', 'ASC']] });
    res.json(rows);
  } catch (err) {
    console.error('error');
    // If model column mismatch, try raw query as fallback
    try {
      const [rows] = await sequelize.query(
        'SELECT id, code, entity_name as "entityName" FROM company_codes ORDER BY code'
      );
      res.json(rows);
    } catch (err2) {
      res.status(500).json({ message: 'Failed to load company codes' });
    }
  }
};
// GET /api/lookups/asset-categories/:id/company-codes
//
// This is the key lookup for the dependent dropdown:
// selecting an Asset Category filters the Company Code list.
//
// HOW IT WORKS:
//   The asset_category_companies junction table maps categories
//   to company codes. We JOIN through it to get only the codes
//   that belong to the selected category.
//
// QUERY EQUIVALENT:
//   SELECT cc.id, cc.code, cc.entity_name
//   FROM company_codes cc
//   JOIN asset_category_companies acc ON acc.company_code_id = cc.id
//   WHERE acc.asset_category_id = :id
//   ORDER BY cc.code;

exports.getCompanyCodesByCategory = async (req, res) => {
  try {
    const { id } = req.params;  // asset_category_id from URL

    // Validate: id must be a positive integer
    if (!id || isNaN(id) || parseInt(id) < 1) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    // Raw query — cleaner than setting up the full BelongsToMany
    // association just for one endpoint
    const [rows] = await sequelize.query(`
      SELECT cc.id, cc.code, cc.entity_name
      FROM   company_codes cc
      JOIN   asset_category_companies acc
             ON acc.company_code_id = cc.id
      WHERE  acc.asset_category_id = :categoryId
      ORDER  BY cc.code
    `, {
      replacements: { categoryId: parseInt(id) },
      type: sequelize.QueryTypes.SELECT,
    });

    // rows is already an array of plain objects here
    // If category has no codes, return empty array (not an error)
    res.json(Array.isArray(rows) ? rows : [rows].filter(Boolean));

  } catch (err) {
    res.status(500).json({ message: 'Failed to load company codes' });
  }
};

// ─── ALL LOOKUPS IN ONE CALL ──────────────────────────────────
// GET /api/lookups/all
//
// WHY: On form open the frontend needs ALL dropdown data at once.
// Making 8 separate API calls would be slow and cause a flash of
// empty dropdowns. One call fetches everything in parallel using
// Promise.all, then returns a single structured object.
//
// RESPONSE SHAPE:
// {
//   salesTypes:     [...],
//   assetCategories:[...],
//   unitCategories: [...],
//   shipTypes:      [...],
//   documentTypes:  [...],
//   taxTypes:       [...],
//   uqcCodes:       [...],
//   statuses:       [...],
// }
// Note: companyCodes are NOT included here because they depend on
// the selected category. They are fetched separately when the user
// picks a category: GET /api/lookups/asset-categories/:id/company-codes

exports.getAllLookups = async (req, res) => {
  try {
    // Run all queries in parallel — much faster than sequential awaits
    const [
      salesTypes,
      assetCategories,
      unitCategories,
      shipTypes,
      documentTypes,
      taxTypes,
      uqcCodes,
      statuses,
    ] = await Promise.all([
      SalesType.findAll(        { order: [['label', 'ASC']] }),
      AssetCategory.findAll(    { order: [['label', 'ASC']] }),
      UnitCategory.findAll(     { order: [['label', 'ASC']] }),
      ShipType.findAll(         { order: [['label', 'ASC']] }),
      DocumentType.findAll(     { order: [['label', 'ASC']] }),
      TaxType.findAll(          { order: [['label', 'ASC']] }),
      UqcCode.findAll(          { order: [['code',  'ASC']] }),
      TransactionStatus.findAll({ where: { active: true }, order: [['id', 'ASC']] }),
    ]);

    res.json({
      salesTypes,
      assetCategories,
      unitCategories,
      shipTypes,
      documentTypes,
      taxTypes,
      uqcCodes,
      statuses,
    });

  } catch (err) {
    res.status(500).json({ message: 'Failed to load lookups' });
  }
};