const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');

router.get('/', dealController.getAllDeals);
router.get('/:id', dealController.getDealById);
router.post('/', dealController.createDeal);
router.put('/:id', dealController.updateDeal);
router.delete('/:id', dealController.deleteDeal);

module.exports = router;
