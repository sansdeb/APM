// controllers/documentController.js
//
// Handles file uploads using multer.
// Files are saved to: backend/uploads/ folder.
// The path to each file is stored in asset_request_documents table.
//
// INSTALL FIRST:
//   cd backend && npm install multer
//
// ENDPOINT:
//   POST /api/assets/:id/documents
//   Content-Type: multipart/form-data
//   Fields: far, other, sourcing, dc, payment (each is one file)

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
  const AssetRequestDocument = require('../models/AssetRequestDocument');
   const AssetRequest = require('../models/AssetRequest');
const crypto = require('crypto');
// ─── Multer storage config ────────────────────────────────────
// Files saved to backend/uploads/ with original name preserved.
// In production replace this with S3/cloud storage.

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Create uploads/ folder if it doesn't exist
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
filename: (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  cb(null, safeName);   // e.g. 1718345678901-a3f9c2b1e8d40f7a.pdf
},});

// Allow only PDF, JPG, PNG, XLSX
const fileFilter = (req, file, cb) => {
  const allowedExt  = ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.xls'];
  const allowedMime = [
    'application/pdf', 'image/jpeg', 'image/png',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExt.includes(ext) && allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
});

// ─── Upload middleware ────────────────────────────────────────
// Accepts up to 5 named file fields matching the 5 upload slots in the form
exports.uploadMiddleware = upload.fields([
  { name: 'far',      maxCount: 1 },
  { name: 'other',    maxCount: 1 },
  { name: 'sourcing', maxCount: 1 },
  { name: 'dc',       maxCount: 1 },
  { name: 'payment',  maxCount: 1 },
]);

// ─── Controller ───────────────────────────────────────────────
exports.uploadDocuments = async (req, res) => {
  try {
    const { id } = req.params; // asset_request_id

    // req.files is populated by multer:
    // { far: [{ originalname, filename, path }], other: [...], ... }
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    // in uploadDocuments, after the req.files check:
const request = await AssetRequest.findOne({
  where: { id, requesterId: req.user.id, deletedAt: null },
});
if (!request) return res.status(404).json({ message: 'Request not found or access denied' });

    // Dynamically require to avoid circular imports at module load time
  

    const saved = [];

    // Loop through each uploaded file and save a row to the DB
    for (const [docType, files] of Object.entries(req.files)) {
      for (const file of files) {
        const doc = await AssetRequestDocument.create({
          assetRequestId: id,
          docType,                       // 'far' | 'other' | 'sourcing' | 'dc' | 'payment'
          originalName:   file.originalname,
          storedPath:     file.path,     // full path on disk e.g. /backend/uploads/1718...-FAR.pdf
          uploadedByRole: 'requestor',   // ← added
          uploadedBy:     req.user.id,
        });
        saved.push({ docType, originalName: file.originalname, id: doc.id });
      }
    }

    res.status(201).json({
      message: `${saved.length} document(s) uploaded successfully`,
      documents: saved,
    });

  } catch (err) {
    console.error('uploadDocuments error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
};

// ─── Taxation document upload ─────────────────────────────────
// POST /api/taxation/:id/documents
// Single file, field name: 'taxation_document'
exports.taxationUploadMiddleware = upload.single('taxation_document');

exports.uploadTaxationDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
   
const reqId = parseInt(req.params.id, 10);
if (Number.isNaN(reqId)) return res.status(400).json({ message: 'Invalid request id' });

const request = await AssetRequest.findOne({ where: { id: reqId, deletedAt: null } });
if (!request) return res.status(404).json({ message: 'Request not found' });

const taxationStatuses = await TransactionStatus.findAll({
  where: { status_name: { [Op.in]: ['InProgress Taxation', 'Taxation Validated Request'] } }
});
const allowed = taxationStatuses.map(s => s.id);
if (!allowed.includes(request.statusId)) {
  return res.status(403).json({ message: 'Request is not currently with Taxation' });
}

    

    const doc = await AssetRequestDocument.create({
      assetRequestId: id,
      docType:        'taxation',
      originalName:   req.file.originalname,
      storedPath:     req.file.path,
      uploadedByRole: 'taxation',
      uploadedBy:     req.user.id,
    });

    res.status(201).json({
      message:  'Taxation document uploaded successfully',
      document: { id: doc.id, docType: doc.docType, originalName: doc.originalName },
    });
  } catch (err) {
   console.error('uploadTaxationDocument error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
};