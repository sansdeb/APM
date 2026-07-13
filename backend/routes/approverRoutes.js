const express    = require('express');
const router     = express.Router();
const { protect,authorize } = require('../middleware/authMiddleware');
const approver   = require('../controllers/approverController');

// All approver routes require a valid JWT
router.use(protect);
router.use(authorize('approver')); // Only
router.get('/',           approver.getAssignedRequests);
router.get('/:id',        approver.getRequestDetail);
router.post('/:id/action', approver.takeAction);

module.exports = router;