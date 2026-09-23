
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/authMiddleware');

// Apply authentication middleware before defining the route.
router.use(authenticate);
router.get('/dashboard', analyticsController.getDashboardStats);

router.get('/dashboard', analyticsController.getDashboardStats);

module.exports = router;
