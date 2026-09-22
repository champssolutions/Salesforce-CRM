const fs = require('fs');
const path = require('path');

const dbHelper = `const db = require('../config/database');
const fetchAll = (q, p = []) => new Promise((resolve, reject) => db.all(q, p, (e, r) => e ? reject(e) : resolve(r)));
const runCmd = (q, p = []) => new Promise((resolve, reject) => db.run(q, p, function(e) { e ? reject(e) : resolve(this) }));
`;

// 1. เขียนทับ Analytics Controller (กราฟ Dashboard)
const analyticsCode = dbHelper + `
exports.getDashboardStats = async (req, res) => {
  try {
    const pipeline = await fetchAll("SELECT SUM(amount) as total FROM deals WHERE stage != 'Closed Lost'");
    const openDeals = await fetchAll("SELECT COUNT(*) as count FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')");
    const allDeals = await fetchAll("SELECT COUNT(*) as count FROM deals");
    const wonDeals = await fetchAll("SELECT COUNT(*) as count FROM deals WHERE stage = 'Closed Won'");
    const dealsStage = await fetchAll("SELECT stage, SUM(amount) as total FROM deals GROUP BY stage");
    const casesStat = await fetchAll("SELECT status, COUNT(*) as count FROM cases GROUP BY status");

    res.json({
      quickStats: {
        totalPipeline: pipeline[0]?.total || 0,
        openDeals: openDeals[0]?.count || 0,
        winRate: allDeals[0]?.count > 0 ? parseFloat(((wonDeals[0]?.count || 0) / allDeals[0]?.count * 100).toFixed(1)) : 0
      },
      dealsByStage: (dealsStage || []).reduce((acc, curr) => { acc[curr.stage] = curr.total; return acc; }, {}),
      casesByStatus: (casesStat || []).reduce((acc, curr) => { acc[curr.status] = curr.count; return acc; }, {})
    });
  } catch (err) {
    console.error("Dashboard Final Error:", err);
    res.status(500).json({ error: err.message });
  }
};
`;

// 2. เขียนทับ Case Controller (บันทึกเคส)
const caseCode = dbHelper + `
exports.getAllCases = async (req, res) => {
    try {
        const cases = await fetchAll(\`
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
exports.getCases = exports.getAllCases; // รองรับ Route ทุกชื่อ

exports.getCaseById = async (req, res) => {
    try {
        const cases = await fetchAll("SELECT * FROM cases WHERE id = ?", [req.params.id]);
        res.json(cases[0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createCase = async (req, res) => {
    try {
        const { subject, description, priority, status, account_id, contact_id } = req.body;
        const result = await runCmd(
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
        await runCmd(
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
        await runCmd('DELETE FROM cases WHERE id=?', [req.params.id]);
        res.json({ message: 'Case deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
`;

fs.writeFileSync(path.join(__dirname, 'src', 'controllers', 'analyticsController.js'), analyticsCode);
fs.writeFileSync(path.join(__dirname, 'src', 'controllers', 'caseController.js'), caseCode);
console.log("✅ Final Fix Applied: Controllers are now 100% independent.");