const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');

// GET /api/cases - Get all cases
router.get('/', caseController.getAllCases);

// GET /api/cases/:id - Get single case by ID
router.get('/:id', caseController.getCaseById);

// POST /api/cases - Create new case
router.post('/', caseController.createCase);

// PUT /api/cases/:id - Update case
router.put('/:id', caseController.updateCase);

// DELETE /api/cases/:id - Delete case
router.delete('/:id', caseController.deleteCase);

module.exports = router;
