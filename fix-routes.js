const fs = require('fs');
const path = require('path');

// รายชื่อ Routes ที่ต้องปรับปรุงให้เข้ากับ Controllers ใหม่
const routes = ['account', 'lead', 'contact', 'task', 'product', 'deal', 'quote'];

routes.forEach(name => {
    const routeCode = `const express = require('express');
const router = express.Router();
const controller = require('../controllers/${name}Controller');

// จับคู่ Route เข้ากับฟังก์ชันมาตรฐานใหม่ (getAll, getById, create, update, delete)
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
`;
    const filePath = path.join(__dirname, 'src', 'routes', `${name}Routes.js`);
    fs.writeFileSync(filePath, routeCode);
    console.log(`✅ Synchronized Route: ${name}Routes.js`);
});

console.log("🎉 All routes are now perfectly synced with your controllers!");