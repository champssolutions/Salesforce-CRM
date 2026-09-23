const express = require('express');
const router = express.Router();
const controller = require('../controllers/contactController');
const { authenticate } = require('../middlewares/authMiddleware');

// จับคู่ Route เข้ากับฟังก์ชันมาตรฐานใหม่ (getAll, getById, create, update, delete)
// ป้องกันด้วย JWT authentication ทั้งหมด
router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
