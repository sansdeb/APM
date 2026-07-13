const { Op }               = require('sequelize');
const AssetRequest         = require('../models/AssetRequest');
const AssetRequestItem     = require('../models/AssetRequestItem');
const AssetRequestDocument = require('../models/AssetRequestDocument');
const AssetRequestGst      = require('../models/AssetRequestGst');
const TransactionStatus    = require('../models/TransactionStatus');
const RequestAuditLog      = require('../models/RequestAuditLog');
const User                 = require('../models/User');
const SalesType            = require('../models/SalesType');
const AssetCategory        = require('../models/AssetCategory');
const CompanyCode          = require('../models/CompanyCode');
const UnitCategory         = require('../models/UnitCategory');
const DocumentType         = require('../models/DocumentType');
const TaxType              = require('../models/TaxType');
const { getCommentsHistory } = require('../utils/commentsHistory');
const sequelize = require('../config/db');


// ── helper: full include array ─────────────────────────────────
const fullIncludes = [
  { model: TransactionStatus, as: 'status',       attributes: ['id', 'status_name', 'status_description'] },
  { model: SalesType,         as: 'salesType',     attributes: ['id', 'label'] },
  { model: AssetCategory,     as: 'assetCategory', attributes: ['id', 'label'] },
  { model: CompanyCode,       as: 'companyCode',   attributes: ['id', 'code', 'entity_name'] },
  { model: UnitCategory,      as: 'unitCategory',  attributes: ['id', 'label'] },
  { model: DocumentType,      as: 'documentType',  attributes: ['id', 'label'] },
  { model: TaxType,           as: 'taxType',       attributes: ['id', 'label'] },
  { model: User,              as: 'requester',     attributes: ['id', 'name', 'employee_id', 'email'] },
  { model: AssetRequestItem,     as: 'items',     required: false },
  { model: AssetRequestDocument, as: 'documents', required: false },
  { model: AssetRequestGst,      as: 'gstRows',   required: false },
];

// ── helper: block edits on closed (Taxation Approved) requests ─
async function isRequestClosed(request) {
  const approved = await TransactionStatus.findOne({
    where: { status_name: 'Taxation Approved' },
  });
  return approved && request.statusId === approved.id;
}

// ── GET /api/taxation/ ─────────────────────────────────────────
// Shows requests at statuses: InProgress Taxation (4),
// Taxation Validated Request (13), Taxation Approved (5).
// Referred-back (12) requests leave the taxation view.
exports.getRequests = async (req, res) => {
  try {
    const statuses = await TransactionStatus.findAll({
      where: { status_name: { [Op.in]: [
        'InProgress Taxation',
        'Taxation Validated Request',
        'Taxation Approved',
        'Taxation Referred Back',   // ← added: stays visible after refer-back
      ] } },
    });
    const statusIds = statuses.map(s => s.id);

    const requests = await AssetRequest.findAll({
      where: { statusId: { [Op.in]: statusIds }, deletedAt: null },
      include: fullIncludes,
      order: [['created_at', 'DESC']],
    });

    res.json({ requests });
  } catch (err) {
    console.error('taxation getRequests error:', err);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

// ── GET /api/taxation/:id ──────────────────────────────────────
exports.getRequestDetail = async (req, res) => {
  try {
      async function isInTaxationStage(request, extraStatuses = []) {
  const names = ['InProgress Taxation', 'Taxation Validated Request', ...extraStatuses];
  const statuses = await TransactionStatus.findAll({
    where: { status_name: { [Op.in]: names } },
  });
  return statuses.some(s => s.id === request.statusId);
}
    const request = await AssetRequest.findOne({
      where: { id: req.params.id, deletedAt: null },
      include: fullIncludes,
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (!(await isInTaxationStage(request))) {
  return res.status(403).json({ message: 'Request is not currently with Taxation' });
}

   const commentsHistory = await getCommentsHistory(request);
    const taxTypes = await TaxType.findAll({
      attributes: ['id', 'label'],
      order: [['id', 'ASC']],
    });
    res.json({ request, commentsHistory, taxTypes });
  } catch (err) {
    console.error('taxation getRequestDetail error:', err);
    res.status(500).json({ message: 'Failed to fetch request'});

  }

};

// ── helper: persist tax invoice fields, line item GST, GST rows ─
// Shared by saveDraft and validate.
async function persistTaxationData(request, body) {
  const { taxInvoiceNo, taxInvoiceDate,taxTypeId, items, gstRows } = body;

  // Update tax invoice fields on the request
  await request.update({
    taxInvoiceNo:   taxInvoiceNo   || null,
    taxInvoiceDate: taxInvoiceDate || null,
    ...(taxTypeId !== undefined && taxTypeId !== null && taxTypeId !== ''
      ? { taxTypeId: parseInt(taxTypeId, 10) }
      : {}),
  });

  // Update each line item's GST fields
  if (Array.isArray(items)) {
    for (const it of items) {
      if (!it.id) continue;
      await AssetRequestItem.update(
        {
          gstRate:      it.gstRate      ?? null,
          itemRate:     it.itemRate     ?? null,
          taxableValue: it.taxableValue ?? null,
          gstAmount:    it.gstAmount    ?? null,
          totalAmount:  it.totalAmount  ?? null,
        },
        { where: { id: it.id, assetRequestId: request.id } }
      );
    }
  }

  // Replace GST breakdown rows — delete existing, insert new
  if (Array.isArray(gstRows)) {
    await AssetRequestGst.destroy({ where: { assetRequestId: request.id } });
    for (const g of gstRows) {
      if (!g.gstType || g.gstRate == null || g.amount == null) continue;
      await AssetRequestGst.create({
        assetRequestId: request.id,
        gstType:        g.gstType,
        gstRate:        g.gstRate,
        amount:         g.amount,
      });
    }
  }
}

// ── POST /api/taxation/:id/save ────────────────────────────────
// Saves all taxation data, status stays InProgress Taxation.
// Writes comment to audit log only if a comment is provided.
exports.saveDraft = async (req, res) => {
  try {
    async function isInTaxationStage(request, extraStatuses = []) {
  const names = ['InProgress Taxation', 'Taxation Validated Request', ...extraStatuses];
  const statuses = await TransactionStatus.findAll({
    where: { status_name: { [Op.in]: names } },
  });
  return statuses.some(s => s.id === request.statusId);
}
    const request = await AssetRequest.findOne({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (!(await isInTaxationStage(request))) {
  return res.status(403).json({ message: 'Request is not currently with Taxation' });
}
    if (await isRequestClosed(request)) {
      return res.status(403).json({ message: 'Request is closed and can no longer be edited' });
    }

    await persistTaxationData(request, req.body);

    // Save comment on request + audit log (if provided)
    const { comment } = req.body;
    if (comment && comment.trim()) {
      await request.update({ taxationComments: comment.trim() });
      await RequestAuditLog.create({
        assetRequestId: request.id,
        changedBy:      req.user.id,
        fromStatusId:   request.statusId,
        toStatusId:     request.statusId,
        comment:        comment.trim(),
      });
    }

    res.json({ message: 'Draft saved' });
  } catch (err) {
    console.error('taxation saveDraft error:', err);
    res.status(500).json({ message: 'Save failed'});
  }
};

// ── POST /api/taxation/:id/validate ────────────────────────────
// Validates tax invoice no + date + at least one GST row present.
// Sets is_validated = true, status → Taxation Validated Request.
exports.validate = async (req, res) => {
  try {
    async function isInTaxationStage(request, extraStatuses = []) {
  const names = ['InProgress Taxation', 'Taxation Validated Request', ...extraStatuses];
  const statuses = await TransactionStatus.findAll({
    where: { status_name: { [Op.in]: names } },
  });

  return statuses.some(s => s.id === request.statusId);
}
    const request = await AssetRequest.findOne({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (!(await isInTaxationStage(request))) {
  return res.status(403).json({ message: 'Request is not currently with Taxation' });
}
if (await isRequestClosed(request)) {
      return res.status(403).json({ message: 'Request is closed and can no longer be edited' });
    }
      const inProgressTax = await TransactionStatus.findOne({ where: { status_name: 'InProgress Taxation' } });
if (request.statusId !== inProgressTax.id) {
  return res.status(409).json({ message: 'Only requests In Progress with Taxation can be validated' });
}
  

    // Validation checks
  const { taxInvoiceNo, taxInvoiceDate, items, gstRows, comment } = req.body;

    const effectiveTaxTypeId = req.body.taxTypeId ?? request.taxTypeId;
    const taxTypeRow = await TaxType.findByPk(effectiveTaxTypeId);
    const isWithoutTax = taxTypeRow && /without\s*tax/i.test(taxTypeRow.label || '');

    // Validation checks
    const errors = [];
    if (!taxInvoiceNo || !taxInvoiceNo.trim()) errors.push('Tax Invoice No is required');
    if (!taxInvoiceDate) errors.push('Tax Invoice Date is required');

    if (!isWithoutTax) {
      // With Tax — every line item must have a valid GST rate (0–100)
      if (!Array.isArray(items) || items.length === 0) {
        errors.push('Line items are required');
      } else {
        items.forEach((it, idx) => {
          const rate = parseFloat(it.gstRate);
          if (it.gstRate == null || it.gstRate === '' || isNaN(rate)) {
            errors.push(`Line item ${idx + 1}: GST rate is required`);
          } else if (rate < 0 || rate > 100) {
            errors.push(`Line item ${idx + 1}: GST rate must be between 0 and 100`);
          }
        });
      }
      // At least one GST breakdown row
      if (!Array.isArray(gstRows) || gstRows.length === 0) {
        errors.push('GST breakdown is required (select a GST type)');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    // Persist data first
    await persistTaxationData(request, req.body);

    // Move to validated status
    const validated = await TransactionStatus.findOne({ where: { status_name: 'Taxation Validated Request' } });
    if (!validated) return res.status(500).json({ message: 'Status not found' });

    const oldStatusId = request.statusId;
    await request.update({ statusId: validated.id, isValidated: true });

    await RequestAuditLog.create({
      assetRequestId: request.id,
      changedBy:      req.user.id,
      fromStatusId:   oldStatusId,
      toStatusId:     validated.id,
      comment:        (comment && comment.trim()) || 'Request validated',
    });

    res.json({ message: 'Request validated successfully' });
  } catch (err) {
    console.error('taxation validate error:', err);
    res.status(500).json({ message: 'Validation failed' });
  }
};

// ── POST /api/taxation/:id/action ──────────────────────────────
// action: 'referback' | 'close'
// close only allowed if request.isValidated === true
exports.takeAction = async (req, res) => {
  try {
    async function isInTaxationStage(request, extraStatuses = []) {
  const names = ['InProgress Taxation', 'Taxation Validated Request', ...extraStatuses];
  const statuses = await TransactionStatus.findAll({
    where: { status_name: { [Op.in]: names } },
  });
 const validatedStatus = await TransactionStatus.findOne({
  where: { status_name: 'Taxation Validated Request' }
});
if (action === 'close' && request.statusId !== validatedStatus.id) {
  return res.status(400).json({ message: 'Request must be in Validated status before closing' });
}
  return statuses.some(s => s.id === request.statusId);
}
    const { action, comment } = req.body;
    const request = await AssetRequest.findOne({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (!(await isInTaxationStage(request))) {
  return res.status(403).json({ message: 'Request is not currently with Taxation' });
}
    if (await isRequestClosed(request)) {
      return res.status(403).json({ message: 'Request is closed and can no longer be edited' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comments are required before taking action' });
    }

    let targetStatusName;
    if (action === 'referback') {
      targetStatusName = 'Taxation Referred Back';
    } else if (action === 'close') {
      if (!request.isValidated) {
        return res.status(400).json({ message: 'Request must be validated before closing' });
      }
      targetStatusName = 'Taxation Approved';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const newStatus = await TransactionStatus.findOne({ where: { status_name: targetStatusName } });
    if (!newStatus) return res.status(500).json({ message: `Status "${targetStatusName}" not found` });

    const oldStatusId = request.statusId;
  await request.update({ statusId: newStatus.id, approvedBy: req.user.id, isValidated: false });

    await RequestAuditLog.create({
      assetRequestId: request.id,
      changedBy:      req.user.id,
      fromStatusId:   oldStatusId,
      toStatusId:     newStatus.id,
      comment:        comment.trim(),
    });

    res.json({ message: `Request ${action === 'close' ? 'closed' : 'referred back'} successfully` });
  } catch (err) {
    console.error('taxation takeAction error:', err);
    res.status(500).json({ message: 'Action failed' });
  }
};

// ── GET /api/taxation/:id/status-history ───────────────────────
// Returns all audit log entries for a request, newest last.
// Used by the taxation dashboard's Status History modal.
exports.getStatusHistory = async (req, res) => {
  try {
   
    
    
const id = parseInt(req.params.id, 10);
if (Number.isNaN(id) || id < 1) return res.status(400).json({ message: 'Invalid request id' });

    const rows = await sequelize.query(
      `SELECT
         ral.id,
         ral.comment,
         ral.changed_at        AS "changedAt",
         u.name                AS "changedByName",
         u.employee_id         AS "changedByEmployeeId",
         fs.status_name        AS "fromStatus",
         ts.status_name        AS "toStatus"
       FROM request_audit_log ral
       LEFT JOIN users               u  ON u.id  = ral.changed_by
       LEFT JOIN transaction_statuses fs ON fs.id = ral.from_status_id
       LEFT JOIN transaction_statuses ts ON ts.id = ral.to_status_id
       WHERE ral.asset_request_id = :id
       ORDER BY ral.changed_at ASC`,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({ history: rows });
  } catch (err) {
    console.error('getStatusHistory error:', err);
    res.status(500).json({ message: 'Failed to fetch status history' });
  }
};

// ── GET /api/taxation/:id/invoice ──────────────────────────────
// Returns everything needed to render the Tax Invoice print view.
// Only available when status = Taxation Approved (status 5).
exports.getInvoiceData = async (req, res) => {
  try {
    const request = await AssetRequest.findOne({
      where: { id: req.params.id, deletedAt: null },
      include: fullIncludes,
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const approved = await TransactionStatus.findOne({
      where: { status_name: 'Taxation Approved' },
    });
    if (!approved || request.statusId !== approved.id) {
      return res.status(403).json({ message: 'Invoice only available for approved requests' });
    }

    res.json({ request });
  } catch (err) {
    console.error('getInvoiceData error:', err);
    res.status(500).json({ message: 'Failed to fetch invoice data' });
  }
};

