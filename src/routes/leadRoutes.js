const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

// GET /api/leads
router.get('/', leadController.getAllLeads);

// GET /api/leads/:id
router.get('/:id', leadController.getLeadById);

// POST /api/leads
router.post('/', leadController.createLead);

// PUT /api/leads/:id
router.put('/:id', leadController.updateLead);

// DELETE /api/leads/:id
router.delete('/:id', leadController.deleteLead);

// POST /api/leads/:id/convert
router.post('/:id/convert', leadController.convertLead);

module.exports = router;
