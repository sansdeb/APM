// routes/assetRoutes.js

const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const { protect, authorize } = require('../middleware/authMiddleware');
const asset    = require('../controllers/assetController');
const { uploadMiddleware, uploadDocuments } = require('../controllers/documentController');
const AssetRequestDocument = require('../models/AssetRequestDocument');
const AssetRequest         = require('../models/AssetRequest');

// protect applies to every route in this file
router.use(protect);

// ── Requester-only routes (explicit authorize per route) ───────
router.post('/save',   authorize('requester'), asset.saveDraft);
router.post('/submit', authorize('requester'), asset.submitRequest);
router.get('/',        authorize('requester'), asset.getMyRequests);

// ── Document routes BEFORE /:id ────────────────────────────────

// Download a document
// Access: requester who owns the parent request OR any approver role
router.get('/documents/:docId/view', async (req, res) => {
  try {
    const docId = parseInt(req.params.docId, 10);
    if (Number.isNaN(docId)) {
      return res.status(400).json({ message: 'Invalid document id' });
    }

    // 1. Load the document
    const doc = await AssetRequestDocument.findByPk(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // 2. Load the parent request
    const request = await AssetRequest.findByPk(doc.assetRequestId, {
      attributes: ['id', 'requesterId'],
    });
    if (!request) return res.status(404).json({ message: 'Document not found' });

    // 3. Authorization:
    //    - Requesters may only download docs on their own requests
    //    - Approver roles (approver, fa_team, taxation) may download any
    const APPROVER_ROLES = ['approver', 'fa_team', 'taxation'];
    const isOwner    = request.requesterId === req.user.id;
    const isApprover = APPROVER_ROLES.includes(req.user.role);

    if (!isOwner && !isApprover) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // 4. Path containment — ensure file is inside uploads/ directory
    const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
    const resolved    = path.resolve(doc.storedPath);
    if (!resolved.startsWith(uploadsRoot + path.sep)) {
      return res.status(400).json({ message: 'Invalid file path' });
    }

    // 5. File must exist on disk
    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // 6. Force download — never inline (prevents stored XSS)
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(doc.originalName)}"`
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 7. Stream the file
    fs.createReadStream(resolved).pipe(res);

  } catch (err) {
    console.error('document view error:', err);
    res.status(500).json({ message: 'View failed' });
  }
});

// Delete a document (requester, draft requests only)
router.delete('/documents/:docId', async (req, res) => {
  try {
    const docId = parseInt(req.params.docId, 10);
    if (Number.isNaN(docId)) {
      return res.status(400).json({ message: 'Invalid document id' });
    }

    const requesterId = req.user.id;

    const doc = await AssetRequestDocument.findByPk(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const parentRequest = await AssetRequest.findByPk(doc.assetRequestId, {
      attributes: ['id', 'statusId', 'requesterId'],
    });
    if (!parentRequest) return res.status(404).json({ message: 'Parent request not found' });

    if (parentRequest.requesterId !== requesterId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (fs.existsSync(doc.storedPath)) {
      fs.unlinkSync(doc.storedPath);
    }
    await doc.destroy();

    res.json({ message: 'Document deleted', id: docId });
  } catch (err) {
    console.error('document delete error:', err);
    res.status(500).json({ message: 'Delete failed' });
  }
});

// Upload documents (requester only)
router.post('/:id/documents', authorize('requester'), uploadMiddleware, uploadDocuments);

// Get single request detail (requester only) — AFTER /documents routes
router.get('/:id', authorize('requester'), asset.getRequestById);

// Soft delete (requester only)
router.delete('/:id', authorize('requester'), asset.deleteRequest);

module.exports = router;