const express     = require('express');
const router      = express.Router();
const { protect,authorize } = require('../middleware/authMiddleware');
const fa          = require('../controllers/faController');

router.use(protect);
router.use(authorize('fa_team')); // Only users with 'fa' role can access these routes
router.get('/',            fa.getRequests);
router.get('/:id',         fa.getRequestDetail);
router.post('/:id/action', fa.takeAction);

module.exports = router;