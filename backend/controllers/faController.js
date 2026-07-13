const AssetRequest         = require('../models/AssetRequest');
const AssetRequestItem     = require('../models/AssetRequestItem');
const AssetRequestDocument = require('../models/AssetRequestDocument');
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
];

// ── GET /api/fa/ ───────────────────────────────────────────────
// Returns ALL InProgress FATeam requests — no mapping filter
exports.getRequests = async (req, res) => {
  try {
    const inProgressFA = await TransactionStatus.findOne({
      where: { status_name: 'InProgress FATeam' },
    });

    if (!inProgressFA) {
      return res.status(500).json({ message: 'Status InProgress FATeam not found in DB' });
    }

    const requests = await AssetRequest.findAll({
      where: { statusId: inProgressFA.id, deletedAt: null },
      include: fullIncludes,
      order: [['created_at', 'DESC']],
    });

    res.json({ requests });
  } catch (err) {
    console.error('fa getRequests error:', err);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

// ── GET /api/fa/:id ────────────────────────────────────────────
// Returns single request + unified comments history (all roles)
exports.getRequestDetail = async (req, res) => {
  try {
    const request = await AssetRequest.findOne({
      where: { id: req.params.id, deletedAt: null },
      include: fullIncludes,
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const commentsHistory = await getCommentsHistory(request);

    res.json({ request, commentsHistory });
  } catch (err) {
    console.error('fa getRequestDetail error:', err);
    res.status(500).json({ message: 'Failed to fetch request' });
  }
};

// ── POST /api/fa/:id/action ────────────────────────────────────
// action: 'approve' | 'referback' | 'reject'
// body:   { action, comments }
exports.takeAction = async (req, res) => {

  try {
    const id = parseInt(req.params.id, 10);
if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    const faUserId             = req.user.id;
    const requestId            = req.params.id;
    const { action, comments } = req.body;

    if (!comments || comments.trim() === '') {
      return res.status(400).json({ message: 'Comments are required before taking action' });
    }

    const allowedActions = ['approve', 'referback', 'reject'];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const request = await AssetRequest.findOne({
      where: { id: requestId, deletedAt: null },
    });
    const inProgressFA = await TransactionStatus.findOne({
  where: { status_name: 'InProgress FATeam' }
});
if (request.statusId !== inProgressFA.id) {
  return res.status(409).json({ message: 'Request is not currently with FA Team' });
}

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const statusMap = {
      approve:   'InProgress Taxation',
      referback: 'FA Referred Back',
      reject:    'FA Team Rejected',
    };

    const newStatus = await TransactionStatus.findOne({
      where: { status_name: statusMap[action] },
    });

    if (!newStatus) {
      return res.status(500).json({ message: `Status "${statusMap[action]}" not found in DB` });
    }

    const oldStatusId = request.statusId;

    await request.update({
      statusId:   newStatus.id,
      approvedBy: faUserId,
    });

    await RequestAuditLog.create({
      assetRequestId: request.id,
      changedBy:      faUserId,
      fromStatusId:   oldStatusId,
      toStatusId:     newStatus.id,
      comment:        comments.trim(),
    });

    res.json({ message: `Request ${action}d successfully` });
  } catch (err) {
    console.error('fa takeAction error:', err);
    res.status(500).json({ message: 'Action failed', });
  }
};