// controllers/assetController.js
//
// Handles all asset request operations for the Requester role.
// Four functions:
//   saveDraft    → POST /api/assets/save    (no validation)
//   submitRequest→ POST /api/assets/submit  (full validation → InProgress RM)
//   getMyRequests→ GET  /api/assets         (list with filters + pagination)
//   deleteRequest→ DELETE /api/assets/:id   (soft delete, only Requestor Saved)
//
// Status flow:
//   [Save]   → Requestor Saved   (stays with requester)
//   [Submit] → InProgress RM     (moves to approver/RM)

const { Op }               = require('sequelize');
const sequelize            = require('../config/db');
const AssetRequest         = require('../models/AssetRequest');
const TransactionStatus    = require('../models/TransactionStatus');
const RequestAuditLog      = require('../models/RequestAuditLog');
const AssetCategory        = require('../models/AssetCategory');
const CompanyCode          = require('../models/CompanyCode');
// These must be required here so their associations (hasMany etc.)
// are registered on AssetRequest before any query runs.
// Requiring inside a function body can cause association to be
// missing when Sequelize builds the JOIN.
const SalesType            = require('../models/SalesType');
const UnitCategory         = require('../models/UnitCategory');
const DocumentType         = require('../models/DocumentType');
const TaxType              = require('../models/TaxType');
const AssetRequestItem     = require('../models/AssetRequestItem');
const AssetRequestDocument = require('../models/AssetRequestDocument');
const User                  = require('../models/User');
const { getCommentsHistory } = require('../utils/commentsHistory');

// ─── HELPER: get status id by name ───────────────────────────
// Always look up status ids at runtime — never hardcode them.
// This way if ids change (e.g. after a DB reset), code still works.
const getStatusId = async (statusName) => {
  const status = await TransactionStatus.findOne({
    where: { statusName }
  });
  if (!status) throw new Error(`Status '${statusName}' not found in DB`);
  return status.id;
};

// ─── HELPER: generate request number ─────────────────────────
// Format: ASSID + 6-digit zero-padded number  e.g. ASSID008244
// Matches the format shown in the reference dashboard image.
// Finds the highest existing number and increments by 1.
const generateRequestNo = async () => {
  const latest = await AssetRequest.findOne({
    order: [['id', 'DESC']],
    paranoid: false,  // include soft-deleted rows in the count
  });

  if (!latest || !latest.requestNo) {
    return 'ASSID000001';
  }

  // Extract the numeric part: 'ASSID008244' → 8244
  const num = parseInt(latest.requestNo.replace('ASSID', ''), 10) || 0;
  // Pad to 6 digits: 8245 → '008245'
  return 'ASSID' + String(num + 1).padStart(6, '0');
};

// ─── HELPER: required fields validation ──────────────────────
// Validates the human-readable text fields that must be present.
// We do NOT validate FK id fields (salesTypeId etc.) here because:
//   - They can be null if the user didn't select a dropdown (which is a valid save state)
//   - The frontend REQUIRED_FIELDS array already enforces them before Submit is clickable
//   - Showing "companyCodeId is missing" to the user is confusing and meaningless
//
// We DO validate that at least one line item exists.
const REQUIRED_FIELDS = [
  'entityName', 'assetLocation', 'grossValue', 'wdv', 'costCenter', 'salesValue',
];

// Human-readable labels for each field shown in error messages
const FIELD_LABELS = {
  entityName:    'Entity Name',
  assetLocation: 'Asset Location',
  grossValue:    'Gross Value',
  wdv:           'WDV',
  costCenter:    'Cost Center',
  salesValue:    'Sales Value',
};

const getMissingFields = (body) =>
  REQUIRED_FIELDS
    .filter(f => !body[f] && body[f] !== 0)
    .map(f => FIELD_LABELS[f] || f); // return human labels not field names

// =============================================================
// SAVE DRAFT — POST /api/assets/save
// =============================================================
// NO validation — saves whatever is filled so far.
// If request already exists (requestId in body), UPDATE it.
// If new request, CREATE it with status = Requestor Saved.
// Always returns the requestNo so frontend can display it.
// =============================================================
exports.saveDraft = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const b = req.body;

    const savedStatusId = await getStatusId('Requestor Saved');
    // AssetRequestItem imported at top of file

    const fields = {
      salesTypeId:     b.salesTypeId      || null,
      assetCategoryId: b.assetCategoryId  || null,
      companyCodeId:   b.companyCodeId    || null,
      companyCodeLabel: b.companyCodeLabel || null,
      unitCategoryId:  b.unitCategoryId   || null,
      categoryOfUnits: b.categoryOfUnits  || null,
      entityName:      b.entityName      || null,
      assetLocation:   b.assetLocation   || null,
      grossValue:      b.grossValue      ?? null,
      wdv:             b.wdv             ?? null,
      costCenter:      b.costCenter      || null,
      salesValue:      b.salesValue      ?? null,
      documentTypeId:  b.documentTypeId  || null,
      taxTypeId:       b.taxTypeId       || null,
      comments:        b.comments        || null,
      consignerName:     b.consignerName     || null,
      consignerAddress:  b.consignerAddress  || null,
      consignerPincode:  b.consignerPincode  || null,
      consignerLocation: b.consignerLocation || null,
      plantCode:         b.plantCode         || null,
      consignerGstin:    b.consignerGstin    || null,
      consigneeName:            b.consigneeName            || null,
      consigneeAddress:         b.consigneeAddress         || null,
      consigneePincode:         b.consigneePincode         || null,
      consigneeLocation:        b.consigneeLocation        || null,
      consigneeGstin:           b.consigneeGstin           || null,
      consigneeCategoryOfUnits: b.consigneeCategoryOfUnits || null,
      consigneePlantCode:       b.consigneePlantCode       || null,
      consigneeCostCentre:      b.consigneeCostCentre      || null,
      shipToName:    b.shipToName    || null,
      shipToAddress: b.shipToAddress || null,
      shipToGstin:   b.shipToGstin   || null,
      type:          b.type          || null,
    };

    // ── Helper: save line items for a given requestId ─────────
    // Deletes existing rows then re-inserts — simpler than diffing.
    // Only saves items that have at least a description.
    const saveLineItems = async (requestId, transaction) => {
      const items = Array.isArray(b.lineItems) ? b.lineItems : [];
      const validItems = items.filter(i => i.description?.trim());
      if (validItems.length === 0) return;

      await AssetRequestItem.destroy({
        where: { assetRequestId: requestId },
        transaction,
      });

      await AssetRequestItem.bulkCreate(
        validItems.map((item, idx) => ({
          assetRequestId: requestId,
          sno:            idx + 1,
          description:    item.description.trim(),
          uqcCode:        item.uqc     || null,
          quantity:       parseFloat(item.quantity) || 0,
          rate:           parseFloat(item.rate)     || 0,
          hsnCode:        item.hsnCode || null,
        })),
        { transaction }
      );
    };

    if (b.requestId) {
      // UPDATE existing draft
      const existing = await AssetRequest.findOne({
        where: { id: b.requestId, requesterId, deletedAt: null }
      });
      if (!existing) {
        return res.status(404).json({ message: 'Request not found or access denied' });
      }
     const referredBackId = await getStatusId('Taxation Referred Back');
      if (existing.statusId !== savedStatusId && existing.statusId !== referredBackId) {
        return res.status(403).json({ message: 'Cannot edit a submitted request' });
      }

      await sequelize.transaction(async (t) => {
        await existing.update(fields, { transaction: t });
        await saveLineItems(existing.id, t);
      });

      return res.json({
        message:   'Draft saved successfully',
        requestId: existing.id,
        requestNo: existing.requestNo,
      });
    }

    // CREATE new draft
    const requestNo = await generateRequestNo();
    let newRequest;

    await sequelize.transaction(async (t) => {
      newRequest = await AssetRequest.create(
        { requesterId, requestNo, statusId: savedStatusId, ...fields },
        { transaction: t }
      );

      await RequestAuditLog.create({
        assetRequestId: newRequest.id,
        fromStatusId:   null,
        toStatusId:     savedStatusId,
        changedBy:      requesterId,
        comment:        'Draft created',
      }, { transaction: t });

      await saveLineItems(newRequest.id, t);
    });

    return res.status(201).json({
      message:   'Draft saved successfully',
      requestId: newRequest.id,
      requestNo: newRequest.requestNo,
    });

  } catch (err) {
    
    res.status(500).json({ message: 'Server error' });
  }
};

// =============================================================
// SUBMIT REQUEST — POST /api/assets/submit
// =============================================================
// FULL validation — all required fields must be present.
// Transitions status: Requestor Saved → InProgress RM.
// Sets submittedAt timestamp.
// Writes audit log entry.
// =============================================================
exports.submitRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { requestId, lineItems } = req.body;


    if (!requestId) {
      return res.status(400).json({ message: 'requestId is required to submit' });
    }

    // ── Validate required text fields ─────────────────────────
    const missing = getMissingFields(req.body);
    if (missing.length > 0) {
      return res.status(400).json({
        message:       'Please fill all required fields before submitting',
        missingFields: missing,
      });
    }

    // ── Validate at least one line item ───────────────────────
    // lineItems is an array sent from the frontend form.
    // A valid item must have description + quantity + rate.
    const validItems = Array.isArray(lineItems)
      ? lineItems.filter(item =>
          item.description && item.description.trim() &&
          item.quantity    && parseFloat(item.quantity) > 0 &&
          item.rate        && parseFloat(item.rate)     > 0
        )
      : [];

    if (validItems.length === 0) {
      return res.status(400).json({
        message: 'At least one line item with description, quantity and rate is required before submitting',
      });
    }

    const savedStatusId        = await getStatusId('Requestor Saved');
const rmStatusId           = await getStatusId('InProgress RM');
const taxationStatusId     = await getStatusId('InProgress Taxation');
const referredBackStatusId = await getStatusId('Taxation Referred Back');   // NEW

    const request = await AssetRequest.findOne({
      where: { id: requestId, requesterId, deletedAt: null }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found or access denied' });
    }

   // OLD:
// if (request.statusId !== savedStatusId) {
//   return res.status(403).json({ message: 'Request has already been submitted' });
// }

// NEW — submit allowed from draft OR taxation refer-back:
// OLD:
// const isResubmit = request.statusId === referredBackStatusId;
// if (request.statusId !== savedStatusId && !isResubmit) {
//   return res.status(403).json({ message: 'Request has already been submitted' });
// }
// const previousStatusId = request.statusId;

// NEW:
const isResubmit = request.statusId === referredBackStatusId;

if (request.statusId !== savedStatusId && !isResubmit) {
  return res.status(403).json({ message: 'Request has already been submitted' });
}

const previousStatusId = request.statusId;
const nextStatusId     = isResubmit ? taxationStatusId : rmStatusId;

    // ── Save line items + transition status in one transaction ─
    // AssetRequestItem imported at top of file

    await sequelize.transaction(async (t) => {

      // Update the main request row + transition status
      await request.update({
        salesTypeId:     req.body.salesTypeId     || request.salesTypeId,
        assetCategoryId: req.body.assetCategoryId || request.assetCategoryId,
        companyCodeId:   req.body.companyCodeId   || request.companyCodeId,
        unitCategoryId:  req.body.unitCategoryId  || request.unitCategoryId,
        entityName:      req.body.entityName      || request.entityName,
        assetLocation:   req.body.assetLocation   || request.assetLocation,
        grossValue:      req.body.grossValue       ?? request.grossValue,
        wdv:             req.body.wdv              ?? request.wdv,
        costCenter:      req.body.costCenter      || request.costCenter,
        salesValue:      req.body.salesValue       ?? request.salesValue,
        documentTypeId:  req.body.documentTypeId  ?? request.documentTypeId,
        taxTypeId:       req.body.taxTypeId        ?? request.taxTypeId,
        comments:        req.body.comments         ?? request.comments,
        statusId:        nextStatusId, 
        submittedAt:     new Date(),
      }, { transaction: t });

      // Delete existing line items then re-insert
      // (simpler than diffing which rows changed)
      await AssetRequestItem.destroy({
        where: { assetRequestId: request.id },
        transaction: t,
      });

      // Insert all valid line items
      const itemRows = validItems.map((item, idx) => ({
        assetRequestId: request.id,
        sno:            idx + 1,
        description:    item.description.trim(),
        uqcCode:        item.uqc        || null,
        quantity:       parseFloat(item.quantity),
        rate:           parseFloat(item.rate),
        hsnCode:        item.hsnCode    || null,
      }));

      await AssetRequestItem.bulkCreate(itemRows, { transaction: t });

      // Write audit log
      await RequestAuditLog.create({
  assetRequestId: request.id,
  fromStatusId:   previousStatusId,
  toStatusId:     nextStatusId,
  changedBy:      requesterId,
  comment:        isResubmit
    ? (req.body.comments || 'Resubmitted after taxation refer-back')
    : 'Submitted by requester',
}, { transaction: t });

    });

    return res.json({
      message:   'Request submitted successfully',
      requestId: request.id,
      requestNo: request.requestNo,
      status:    'InProgress RM',
    });

  } catch (err) {
    console.error('submitRequest error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =============================================================
// GET MY REQUESTS — GET /api/assets
// =============================================================
// Returns the logged-in requester's own requests only.
// Supports filters: ?from=  &to=  &requestNo=
// Supports pagination: ?page=1 &limit=10
// Joins status table so response includes the status label.
// =============================================================
exports.getMyRequests = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const {
      from,
      to,
      requestNo,
      page  = 1,
      limit = 3,   // 3 requests per page
    } = req.query;

    // ── Build WHERE clause dynamically ───────────────────────
    const where = {
      requesterId,
      deletedAt: null,  // exclude soft-deleted
    };

    // Date range filter:
    // For submitted requests → filter on submittedAt
    // For drafts (submittedAt is NULL) → filter on createdAt
    // Using Op.or so BOTH types appear in date-filtered results
    if (from || to) {
      const dateRange = {};
      if (from) dateRange[Op.gte] = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateRange[Op.lte] = toDate;
      }
      where[Op.or] = [
        { submittedAt: dateRange },
        { createdAt:   dateRange },
      ];
    }

    // Request number filter — partial match (ILIKE = case-insensitive)
    if (requestNo) {
      where.requestNo = { [Op.iLike]: `%${requestNo}%` };
    }

    // ── Pagination ────────────────────────────────────────────
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // ── Query ─────────────────────────────────────────────────
    const { count, rows } = await AssetRequest.findAndCountAll({
      where,
      include: [
        {
          model: TransactionStatus,
          as:    'status',
          attributes: ['statusName', 'statusDescription'],
          // statusDescription = the human label shown in "Pending With" column
        },
        {
          model:      AssetCategory,
          as:         'assetCategory',
          attributes: ['label'],
        },
        {
          model:      CompanyCode,
          as:         'companyCode',
          attributes: ['code', 'entityName'],
        },
      ],
      attributes: [
        'id', 'requestNo', 'entityName', 'assetLocation',
        'salesValue', 'submittedAt', 'createdAt',
      ],
      // Secondary sort by id breaks ties when createdAt timestamps collide
      // (e.g. bulk-seeded rows) — without it, Postgres orders ties
      // arbitrarily per-query, causing rows to skip or duplicate across pages.
      order:  [['createdAt', 'DESC'], ['id', 'DESC']],  // newest first
      limit:  parseInt(limit),
      offset,
    });

    return res.json({
      requests:    rows,
      total:       count,
      page:        parseInt(page),
      totalPages:  Math.ceil(count / parseInt(limit)),
    });

  } catch (err) {
    console.error('getMyRequests error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =============================================================
// SOFT DELETE — DELETE /api/assets/:id
// =============================================================
// Only allowed when status = Requestor Saved.
// Sets deletedAt = NOW() instead of removing the row.
// This preserves the audit trail.



exports.deleteRequest = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    const requesterId   = req.user.id;
   
    const savedStatusId = await getStatusId('Requestor Saved');

    const request = await AssetRequest.findOne({
      where: {
        id,
        requesterId,
        deletedAt: null,
      }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found or access denied' });
    }

  if (request.statusId !== savedStatusId) {
  return res.status(403).json({ message: 'Only draft requests can be deleted' });
}

    // Soft delete — set deletedAt, never hard delete
    await request.update({ deletedAt: new Date() });

    return res.json({
      message:   'Request deleted successfully',
      requestId: request.id,
      requestNo: request.requestNo,
    });

  } catch (err) {
    console.error('deleteRequest error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =============================================================
// GET SINGLE REQUEST — GET /api/assets/:id
// =============================================================
exports.getRequestById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    const requesterId = req.user.id;
   
    // All models imported at top of file — associations already registered
    const request = await AssetRequest.findOne({
      where: { id, requesterId, deletedAt: null },
      include: [
        { model: User,              as: 'requester',
          attributes: ['id', 'name', 'employee_id', 'email'] },
        { model: TransactionStatus, as: 'status',
          attributes: ['statusName', 'statusDescription'] },
        { model: SalesType,     as: 'salesType',     attributes: ['id','label'] },
        { model: AssetCategory, as: 'assetCategory', attributes: ['id','label'] },
        { model: CompanyCode,   as: 'companyCode',   attributes: ['id','code','entityName'] },
        { model: UnitCategory,  as: 'unitCategory',  attributes: ['id','label'] },
        { model: DocumentType,  as: 'documentType',  attributes: ['id','label'] },
        { model: TaxType,       as: 'taxType',       attributes: ['id','label'] },
        // Line items
        {
          model:      AssetRequestItem,
          as:         'items',
          attributes: ['id','sno','description','uqcCode','quantity','rate','hsnCode'],
          required:   false,
        },
        // Uploaded documents
        {
          model:      AssetRequestDocument,
          as:         'documents',
          attributes: ['id','docType','originalName','storedPath','uploadedAt'],
          required:   false,
        },
      ],
    });
    if (!request) {
      return res.status(404).json({ message: 'Request not found or access denied' });
    }
    // Consigner/consignee fields are now columns on asset_requests directly
    // so they're included automatically in the response — no extra joins needed
    const commentsHistory = await getCommentsHistory(request);
    res.json({ ...request.toJSON(), commentsHistory });
  } catch (err) {
    
    res.status(500).json({ message: 'Server error' });
  }
};