const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login
// ไม่ต้องป้องกันเพราะเป็น endpoint ที่ใช้ขอ token
router.post('/login', authController.login);

module.exports = router;
