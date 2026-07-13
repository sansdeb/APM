const { Op }               = require('sequelize');
const AssetRequest         = require('../models/AssetRequest');
const AssetRequestItem     = require('../models/AssetRequestItem');
const AssetRequestDocument = require('../models/AssetRequestDocument');
const TransactionStatus    = require('../models/TransactionStatus');
const ApproverRequestorMap = require('../models/ApproverRequestorMap');
const RequestAuditLog      = require('../models/RequestAuditLog');
const User                 = require('../models/User');
const SalesType            = require('../models/SalesType');
const AssetCategory        = require('../models/AssetCategory');
const CompanyCode          = require('../models/CompanyCode');
const UnitCategory         = require('../models/UnitCategory');
const DocumentType         = require('../models/DocumentType');
const TaxType              = require('../models/TaxType');
const { getCommentsHistory } = require('../utils/commentsHistory');

// ── helper: full include array (same shape as requestor's getRequestById) ──
const fullIncludes = [
  { model: TransactionStatus, as: 'status',        attributes: ['id', 'status_name', 'status_description'] },
  { model: SalesType,         as: 'salesType',      attributes: ['id', 'label'] },
  { model: AssetCategory,     as: 'assetCategory',  attributes: ['id', 'label'] },
  { model: CompanyCode,       as: 'companyCode',    attributes: ['id', 'code', 'entity_name'] },
  { model: UnitCategory,      as: 'unitCategory',   attributes: ['id', 'label'] },
  { model: DocumentType,      as: 'documentType',   attributes: ['id', 'label'] },
  { model: TaxType,           as: 'taxType',        attributes: ['id', 'label'] },
  { model: User,              as: 'requester',      attributes: ['id', 'name', 'employee_id', 'email'] },
  { model: AssetRequestItem,     as: 'items',     required: false },
  { model: AssetRequestDocument, as: 'documents', required: false },
];

// ── GET /api/approver/requests ─────────────────────────────────────────────
// Returns all InProgress RM requests whose requestor is mapped to this approver
exports.getAssignedRequests = async (req, res) => {
  try {
    const approverId = req.user.id;


    // Find all requestor IDs mapped to this approver
    const mappings = await ApproverRequestorMap.findAll({
      where: { approverId },
    });

    if (mappings.length === 0) {
      return res.json({ requests: [] });
    }

    const requestorIds = mappings.map(m => m.requestorId);

    // Find the status id for "InProgress RM"
    const inProgressRM = await TransactionStatus.findOne({
      where: { status_name: 'InProgress RM' },
    });

    if (!inProgressRM) {
      return res.status(500).json({ message: 'Status InProgress RM not found in DB' });
    }

    const requests = await AssetRequest.findAll({
      where: {
        requesterId: { [Op.in]: requestorIds },
        statusId:    inProgressRM.id,
        deletedAt:   null,
      },
      include: fullIncludes,
      order: [['created_at', 'DESC']],
    });

    res.json({ requests });
  } catch (err) {
    console.error('getAssignedRequests error:', err);
    res.status(500).json({ message: 'Failed to fetch requests'});
  }
};

// ── GET /api/approver/requests/:id ────────────────────────────────────────
// Returns one request — only if this approver is mapped to that requestor
exports.getRequestDetail = async (req, res) => {
  try {
    const approverId = req.user.id;
    const requestId  = req.params.id;

    const request = await AssetRequest.findOne({
      where: { id: requestId, deletedAt: null },
      include: fullIncludes,
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify this approver is mapped to this requestor
    const mapping = await ApproverRequestorMap.findOne({
      where: { approverId, requestorId: request.requesterId },
    });

    if (!mapping) {
      return res.status(403).json({ message: 'Access denied — not your assigned requestor' });
    }

    const commentsHistory = await getCommentsHistory(request);
    res.json({ request, commentsHistory });
  } catch (err) {
    console.error('getRequestDetail error:', err);
    res.status(500).json({ message: 'Failed to fetch request' });
  }
};

// ── POST /api/approver/requests/:id/action ────────────────────────────────
// action: 'approve' | 'referback' | 'reject'
// body:   { action, comments }
exports.takeAction = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    const approverId           = req.user.id;
    const requestId            = req.params.id;
    const { action, comments } = req.body;

    // Validate comments
    if (!comments || comments.trim() === '') {
      return res.status(400).json({ message: 'Comments are required before taking action' });
    }

    // Validate action value
    const allowedActions = ['approve', 'referback', 'reject'];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const request = await AssetRequest.findOne({
      where: { id: requestId, deletedAt: null },
    });
    const inProgressRM = await TransactionStatus.findOne({
  where: { status_name: 'InProgress RM' }
});
if (request.statusId !== inProgressRM.id) {
  return res.status(409).json({ message: 'Request is not currently with RM' });
}


    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify mapping
    const mapping = await ApproverRequestorMap.findOne({
      where: { approverId, requestorId: request.requesterId },
    });

    if (!mapping) {
      return res.status(403).json({ message: 'Access denied — not your assigned requestor' });
    }

    // Map action → status name
    const statusMap = {
      approve:   'InProgress FATeam',
      referback: 'RM Referred Back',
      reject:    'RM Rejected',
    };

    const newStatus = await TransactionStatus.findOne({
      where: { status_name: statusMap[action] },
    });

    if (!newStatus) {
      return res.status(500).json({ message: `Status "${statusMap[action]}" not found in DB` });
    }

    // Capture old status BEFORE updating
    const oldStatusId = request.statusId;

    // Apply updates
    await request.update({
      statusId:         newStatus.id,
      approverComments: comments.trim(),
      approvedBy:       approverId,
    });

    // Audit log
    await RequestAuditLog.create({
      assetRequestId: request.id,
      changedBy:      approverId,
      fromStatusId:   oldStatusId,
      toStatusId:     newStatus.id,
      comment:        comments.trim(),
    });

    res.json({ message: `Request ${action}d successfully` });
  } catch (err) {
    console.error('takeAction error:', err);
    res.status(500).json({ message: 'Action failed' });
  }
};