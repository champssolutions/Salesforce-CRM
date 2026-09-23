const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { authenticate } = require('../middlewares/authMiddleware');

// ป้องกันด้วย JWT authentication ทั้งหมด (ใช้ BEFORE กำหนด route)
router.use(authenticate);

router.get('/', caseController.getCases);
router.get('/:id', caseController.getCaseById);
router.post('/', caseController.createCase);
router.put('/:id', caseController.updateCase);
router.delete('/:id', caseController.deleteCase);

module.exports = router;
