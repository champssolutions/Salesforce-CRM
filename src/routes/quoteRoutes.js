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
