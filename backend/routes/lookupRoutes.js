// routes/lookupRoutes.js
//
// All routes are protected by the protect middleware — the user
// must be logged in to fetch dropdown data.
// Mounted in server.js: app.use('/api/lookups', lookupRoutes)
//
// FULL URL MAP:
//   GET /api/lookups/all
//   GET /api/lookups/sales-types
//   GET /api/lookups/asset-categories
//   GET /api/lookups/asset-categories/:id/company-codes
//   GET /api/lookups/unit-categories
//   GET /api/lookups/ship-types
//   GET /api/lookups/document-types
//   GET /api/lookups/tax-types
//   GET /api/lookups/uqc-codes
//   GET /api/lookups/statuses

const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/authMiddleware');
const lookup   = require('../controllers/lookupController');

// Apply protect to all routes in this file at once.
// Any request without a valid JWT → 401 before reaching the controller.
router.use(protect);

// ── All lookups in one call (used on form open) ───────────────
router.get('/all', lookup.getAllLookups);

// ── Individual lookup endpoints ───────────────────────────────
router.get('/company-codes',    lookup.getAllCompanyCodes);
router.get('/sales-types',     lookup.getSalesTypes);
router.get('/asset-categories',lookup.getAssetCategories);
router.get('/unit-categories', lookup.getUnitCategories);
router.get('/ship-types',      lookup.getShipTypes);
router.get('/document-types',  lookup.getDocumentTypes);
router.get('/tax-types',       lookup.getTaxTypes);
router.get('/uqc-codes',       lookup.getUqcCodes);
router.get('/statuses',        lookup.getStatuses);

// ── Dependent dropdown — MUST be defined after /asset-categories ─
// :id = asset_category_id from the frontend
router.get('/asset-categories/:id/company-codes', lookup.getCompanyCodesByCategory);

module.exports = router;