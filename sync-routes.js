const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, 'src', 'controllers', 'caseController.js');
const routesPath = path.join(__dirname, 'src', 'routes', 'caseRoutes.js');

const controllerCode = `const { getQuery, runQuery } = require('../config/database');

exports.getCases = async (req, res) => {
    try {
        const cases = await getQuery(\`
            SELECT c.*, a.name as account_name, ct.first_name || ' ' || ct.last_name as contact_name
            FROM cases c
            LEFT JOIN accounts a ON c.account_id = a.id
            LEFT JOIN contacts ct ON c.contact_id = ct.id
        \`);
        res.json(cases || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getAllCases = exports.getCases; // เผื่อ Router เรียกชื่อเก่า

exports.getCaseById = async (req, res) => {
    try {
        const cases = await getQuery("SELECT * FROM cases WHERE id = ?", [req.params.id]);
        res.json(cases[0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createCase = async (req, res) => {
    try {
        const { subject, description, priority, status, account_id, contact_id } = req.body;
        const result = await runQuery(
            'INSERT INTO cases (subject, description, priority, status, account_id, contact_id) VALUES (?, ?, ?, ?, ?, ?)',
            [subject, description || '', priority || 'Medium', status || 'New', account_id || null, contact_id || null]
        );
        res.json({ id: result.lastID, message: 'Case created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateCase = async (req, res) => {
    try {
        const { subject, description, priority, status, account_id, contact_id } = req.body;
        await runQuery(
            'UPDATE cases SET subject=?, description=?, priority=?, status=?, account_id=?, contact_id=? WHERE id=?',
            [subject, description || '', priority || 'Medium', status || 'New', account_id || null, contact_id || null, req.params.id]
        );
        res.json({ message: 'Case updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteCase = async (req, res) => {
    try {
        await runQuery('DELETE FROM cases WHERE id=?', [req.params.id]);
        res.json({ message: 'Case deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
`;

const routeCode = `const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');

router.get('/', caseController.getCases);
router.get('/:id', caseController.getCaseById);
router.post('/', caseController.createCase);
router.put('/:id', caseController.updateCase);
router.delete('/:id', caseController.deleteCase);

module.exports = router;
`;

fs.writeFileSync(controllerPath, controllerCode, 'utf8');
fs.writeFileSync(routesPath, routeCode, 'utf8');
console.log('✅ Synchronized caseController.js and caseRoutes.js');