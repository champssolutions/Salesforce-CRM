const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');

// Create a new quote
router.post('/', quoteController.createQuote);

// Get all quotes
router.get('/', quoteController.getAllQuotes);

// Get single quote by ID
router.get('/:id', quoteController.getQuoteById);

// Update quote status
router.patch('/:id/status', quoteController.updateQuoteStatus);

// Delete a quote
router.delete('/:id', quoteController.deleteQuote);

module.exports = router;
const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');

// GET /api/quotes - Get all quotes
router.get('/', quoteController.getAllQuotes);

// POST /api/quotes - Create new quote
router.post('/', quoteController.createQuote);

// DELETE /api/quotes/:id - Delete quote
router.delete('/:id', quoteController.deleteQuote);

module.exports = router;
