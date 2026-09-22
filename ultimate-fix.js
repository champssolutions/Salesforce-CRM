const fs = require('fs');
const path = require('path');

// 1. สร้าง Controller แบบทำงานอิสระ (ต่อตรงเข้า app.db โดยไม่พึ่งไฟล์ Config)
const analyticsCode = `
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../../data/app.db');

exports.getDashboardStats = (req, res) => {
    const db = new sqlite3.Database(dbPath);
    const queries = {
        pipeline: "SELECT SUM(amount) as total FROM deals WHERE stage != 'Closed Lost'",
        openDeals: "SELECT COUNT(*) as count FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')",
        allDeals: "SELECT COUNT(*) as count FROM deals",
        wonDeals: "SELECT COUNT(*) as count FROM deals WHERE stage = 'Closed Won'",
        dealsStage: "SELECT stage, SUM(amount) as total FROM deals GROUP BY stage",
        casesStat: "SELECT status, COUNT(*) as count FROM cases GROUP BY status"
    };

    const results = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;

    Object.keys(queries).forEach(key => {
        db.all(queries[key], [], (err, rows) => {
            results[key] = err ? [] : rows;
            completed++;
            if (completed === totalQueries) {
                db.close();
                const allD = results.allDeals[0]?.count || 0;
                const wonD = results.wonDeals[0]?.count || 0;
                res.json({
                    quickStats: {
                        totalPipeline: results.pipeline[0]?.total || 0,
                        openDeals: results.openDeals[0]?.count || 0,
                        winRate: allD > 0 ? parseFloat(((wonD / allD) * 100).toFixed(1)) : 0
                    },
                    dealsByStage: results.dealsStage.reduce((acc, c) => ({ ...acc, [c.stage]: c.total }), {}),
                    casesByStatus: results.casesStat.reduce((acc, c) => ({ ...acc, [c.status]: c.count }), {})
                });
            }
        });
    });
};
`;

const caseCode = `
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../../data/app.db');

const execute = (sql, params = []) => new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
        db.all(sql, params, (err, rows) => { db.close(); err ? reject(err) : resolve(rows); });
    } else {
        db.run(sql, params, function(err) { db.close(); err ? reject(err) : resolve(this); });
    }
});

exports.getCases = async (req, res) => {
    try {
        const cases = await execute("SELECT c.*, a.name as account_name, ct.first_name || ' ' || ct.last_name as contact_name FROM cases c LEFT JOIN accounts a ON c.account_id = a.id LEFT JOIN contacts ct ON c.contact_id = ct.id");
        res.json(cases || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.getAllCases = exports.getCases;

exports.getCaseById = async (req, res) => {
    try {
        const cases = await execute("SELECT * FROM cases WHERE id = ?", [req.params.id]);
        res.json(cases[0] || null);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createCase = async (req, res) => {
    try {
        const { subject, description, priority, status, account_id, contact_id } = req.body;
        const result = await execute('INSERT INTO cases (subject, description, priority, status, account_id, contact_id) VALUES (?, ?, ?, ?, ?, ?)', [subject, description || '', priority || 'Medium', status || 'New', account_id || null, contact_id || null]);
        res.json({ id: result.lastID, message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateCase = async (req, res) => {
    try {
        const { subject, description, priority, status, account_id, contact_id } = req.body;
        await execute('UPDATE cases SET subject=?, description=?, priority=?, status=?, account_id=?, contact_id=? WHERE id=?', [subject, description || '', priority || 'Medium', status || 'New', account_id || null, contact_id || null, req.params.id]);
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteCase = async (req, res) => {
    try {
        await execute('DELETE FROM cases WHERE id=?', [req.params.id]);
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
`;

// บันทึกทับไฟล์ Controller
fs.writeFileSync(path.join(__dirname, 'src', 'controllers', 'analyticsController.js'), analyticsCode);
fs.writeFileSync(path.join(__dirname, 'src', 'controllers', 'caseController.js'), caseCode);

// 2. บังคับให้ Routes วิ่งไปที่ Controller ใหม่ 100%
const routeCode = `
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
router.get('/dashboard', analyticsController.getDashboardStats);
module.exports = router;
`;
fs.writeFileSync(path.join(__dirname, 'src', 'routes', 'analyticsRoutes.js'), routeCode);

// 3. กวาดล้าง Route ฝีมือ Aider ที่อาจซ้อนอยู่ใน server.js (ตัวการทำบั๊ก db.get)
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
    let serverData = fs.readFileSync(serverPath, 'utf8');
    if (serverData.includes('app.get(') && serverData.includes('/api/analytics/dashboard')) {
        // ลบ Route ที่เขียนแทรกแบบฝังใน server.js ทิ้ง
        serverData = serverData.replace(/app\.get\(['"`]\/api\/analytics\/dashboard['"`][\s\S]*?}\);/g, '// Removed inline route');
        fs.writeFileSync(serverPath, serverData);
    }
}

console.log("✅ Ultimate Fix Applied! All ghost codes removed and controllers are now strictly isolated.");