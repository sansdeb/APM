const express     = require('express');
const router      = express.Router();
const { protect,authorize } = require('../middleware/authMiddleware');
const taxation    = require('../controllers/taxationController');
const { taxationUploadMiddleware, uploadTaxationDocument } = require('../controllers/documentController');




router.use(protect);
router.use(authorize('taxation')); // Only users with 'taxation' role can access these routes

router.get('/',             taxation.getRequests);
router.get('/:id/invoice', taxation.getInvoiceData);
router.get('/:id',          taxation.getRequestDetail);
router.get('/:id/status-history', taxation.getStatusHistory);
router.post('/:id/save',    taxation.saveDraft);
router.post('/:id/validate', taxation.validate);
router.post('/:id/action',  taxation.takeAction);
router.post('/:id/documents', taxationUploadMiddleware, uploadTaxationDocument);

module.exports = router;