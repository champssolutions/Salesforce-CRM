
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/authMiddleware');

// ป้องกันด้วย JWT authentication ทั้งหมด (ใช้ BEFORE กำหนด route)
router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboardStats);

module.exports = router;
