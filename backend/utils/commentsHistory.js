const RequestAuditLog = require('../models/RequestAuditLog');
const User             = require('../models/User');

// ── Builds a unified comments history for a request ────────────
// Combines:
//   1. The requestor's original submission comment (asset_requests.comments)
//   2. All audit log entries (approver + FA team actions, any role)
// Returns array sorted oldest → newest:
//   [{ name, role, comment, timestamp }]
async function getCommentsHistory(request) {
  const history = [];

  // 1. Requestor's original comment — only if present
  if (request.comments && request.comments.trim()) {
    history.push({
      name:      request.requester?.name || 'Requestor',
      role:      'requester',
      comment:   request.comments,
      timestamp: request.submittedAt || request.createdAt,
    });
  }

  // 2. All audit log entries with a comment, any role
  const auditLogs = await RequestAuditLog.findAll({
    where: { assetRequestId: request.id },
    include: [
      { model: User, as: 'changedByUser', attributes: ['id', 'name', 'role'] },
    ],
    order: [['changed_at', 'ASC']],
  });

  auditLogs.forEach(log => {
    if (log.comment && log.comment.trim()) {
      history.push({
        name:      log.changedByUser?.name || 'Unknown',
        role:      log.changedByUser?.role || 'unknown',
        comment:   log.comment,
        timestamp: log.changedAt,
      });
    }
  });

  // Sort all entries chronologically
  history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return history;
}

module.exports = { getCommentsHistory };