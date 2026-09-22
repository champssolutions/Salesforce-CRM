const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');

// กำหนด Routes สำหรับ Cases
router.get('/', caseController.getAllCases);
router.get('/:id', caseController.getCaseById);
router.post('/', caseController.createCase);
router.put('/:id', caseController.updateCase);
router.delete('/:id', caseController.deleteCase);

// ส่งออก router เพื่อให้ server.js นำไปใช้งานได้ (บรรทัดนี้คือตัวแก้ Error)
module.exports = router;

const db = require('../config/database'); // ตัวอย่างการดึง db

// 1. วาง Helper Function ไว้ด้านบน
function normalizeFk(val) {
    if (val === null || val === undefined || val === '' || val === 'null' || val === 'undefined') {
        return null;
    }
    const num = Number(val);
    return isNaN(num) ? null : num;
}

// 2. แก้ไขฟังก์ชัน createCase
exports.createCase = (req, res) => {
    const { subject, title, account_id, contact_id, description, priority, status } = req.body;
    const caseSubject = subject || title || 'Untitled Case';
    
    // >>> ครอบตัวแปรด้วย normalizeFk <<<
    const accountId = normalizeFk(account_id);
    const contactId = normalizeFk(contact_id);

    const sql = `INSERT INTO cases (subject, account_id, contact_id, description, priority, status) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [caseSubject, accountId, contactId, description, priority, status];

    db.run(sql, params, function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
};

// ... โค้ดฟังก์ชันอื่นๆ (getAllCases, getCaseById, etc.) ...const express = require('express');
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
