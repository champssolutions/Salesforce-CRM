const express = require('express');
const opportunityController = require('../controllers/opportunityController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// ป้องกันด้วย JWT authentication ทั้งหมด
router.use(authenticate);

router.get('/', opportunityController.getAllOpportunities);
router.get('/:id', opportunityController.getOpportunityById);
router.post('/', opportunityController.createOpportunity);
router.put('/:id', opportunityController.updateOpportunity);
router.patch('/:id', opportunityController.patchOpportunity);
router.delete('/:id', opportunityController.deleteOpportunity);

module.exports = router;
