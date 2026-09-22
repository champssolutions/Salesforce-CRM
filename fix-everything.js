const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src', 'controllers');

// --- 1. โค้ดแก้ Dashboard ---
const analyticsCode = `const { getQuery } = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const pipeline = await getQuery("SELECT SUM(amount) as total FROM deals WHERE stage != 'Closed Lost'");
    const openDeals = await getQuery("SELECT COUNT(*) as count FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')");
    const allDeals = await getQuery("SELECT COUNT(*) as count FROM deals");
    const wonDeals = await getQuery("SELECT COUNT(*) as count FROM deals WHERE stage = 'Closed Won'");
    const dealsStage = await getQuery("SELECT stage, SUM(amount) as total FROM deals GROUP BY stage");
    const casesStat = await getQuery("SELECT status, COUNT(*) as count FROM cases GROUP BY status");

    const totalPipeline = pipeline[0]?.total || 0;
    const openDealsCount = openDeals[0]?.count || 0;
    const totalCount = allDeals[0]?.count || 0;
    const wonCount = wonDeals[0]?.count || 0;
    const winRate = totalCount > 0 ? ((wonCount / totalCount) * 100).toFixed(1) : 0;

    // แปลง Array เป็น Object ให้ตรงกับที่ Frontend ต้องการ
    const dealsByStage = {};
    if (dealsStage) dealsStage.forEach(d => dealsByStage[d.stage] = d.total);

    const casesByStatus = {};
    if (casesStat) casesStat.forEach(c => casesByStatus[c.status] = c.count);

    res.json({
      quickStats: {
        totalPipeline,
        openDeals: openDealsCount,
        winRate: parseFloat(winRate)
      },
      dealsByStage,
      casesByStatus
    });
  } catch (err) {
    console.error("Super Dashboard Error:", err);
    res.status(500).json({ error: err.message });
  }
};
`;

// สแกนหาและเขียนทับไฟล์ที่มีบั๊ก db.get
fs.readdirSync(controllersDir).forEach(file => {
    if (!file.endsWith('.js')) return;
    const fullPath = path.join(controllersDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('Dashboard API Error') || content.includes('getDashboardStats')) {
        fs.writeFileSync(fullPath, analyticsCode, 'utf8');
        console.log('✅ Overwritten Analytics Controller:', file);
    }
});

// --- 2. โค้ดแก้ Add Case ---
const caseControllerPath = path.join(controllersDir, 'caseController.js');
const caseCode = `const { getQuery, runQuery } = require('../config/database');

exports.getAllCases = async (req, res) => {
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

exports.createCase = async (req, res) => {
    try {
        const { subject, description, priority, status, account_id, contact_id } = req.body;
        const result = await runQuery(
            'INSERT INTO cases (subject, description, priority, status, account_id, contact_id) VALUES (?, ?, ?, ?, ?, ?)',
            [subject, description || '', priority || 'Medium', status || 'New', account_id || null, contact_id || null]
        );
        res.json({ id: result.lastID, message: 'Case created successfully' });
    } catch (err) {
        console.error("Error creating case:", err);
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

if (fs.existsSync(caseControllerPath)) {
    fs.writeFileSync(caseControllerPath, caseCode, 'utf8');
    console.log('✅ Patched caseController.js (Fixed title error)');
}

console.log('🎉 Done! Ready to restart the server.');