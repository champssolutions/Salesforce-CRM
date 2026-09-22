const db = require('../config/database');

function normalizeFk(val) {
    if (val === null || val === undefined || val === '' || val === 'null' || val === 'undefined') {
        return null;
    }
    const num = Number(val);
    return isNaN(num) ? null : num;
}

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) return reject(err);
    resolve(rows);
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve({ lastID: this.lastID, changes: this.changes });
  });
});

// GET /api/cases
exports.getAllCases = async (req, res) => {
  try {
    const cases = await all('SELECT * FROM cases ORDER BY id DESC');
    res.json(cases);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/cases/:id
exports.getCaseById = async (req, res) => {
  try {
    const caseItem = await get('SELECT * FROM cases WHERE id = ?', [req.params.id]);
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(caseItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/cases
exports.createCase = async (req, res) => {
  try {
    const { account_id, contact_id, subject, title, description, priority, status } = req.body;

    // frontend ส่ง subject มา ส่วน client เดิมส่ง title — รองรับทั้งสองแบบ
    const caseSubject = subject || title;

    if (!caseSubject) {
      return res.status(400).json({ error: 'subject is required' });
    }

    // normalizeFk(val) รับค่าเดียว — เดิมส่งชื่อตารางเป็น argument แรก ทำให้ได้ null เสมอ
    const safeAccountId = normalizeFk(account_id);
    const safeContactId = normalizeFk(contact_id);

    // title/description เป็น NOT NULL ในตาราง cases จึงต้องส่งค่าเสมอ
    const sql = `INSERT INTO cases (account_id, contact_id, subject, title, description, priority, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [safeAccountId, safeContactId, caseSubject, caseSubject, description || '', priority || 'Medium', status || 'New'];
    
    const { lastID } = await run(sql, params);

    const newCase = await get('SELECT * FROM cases WHERE id = ?', [lastID]);
    res.status(201).json(newCase);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/cases/:id
exports.updateCase = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const caseItem = await get('SELECT * FROM cases WHERE id = ?', [req.params.id]);
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    await run(
      'UPDATE cases SET title = ?, description = ? WHERE id = ?',
      [title, description || '', req.params.id]
    );

    const updatedCase = await get('SELECT * FROM cases WHERE id = ?', [req.params.id]);
    res.json(updatedCase);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/cases/:id
exports.deleteCase = async (req, res) => {
  try {
    const { changes } = await run('DELETE FROM cases WHERE id = ?', [req.params.id]);
    if (changes === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json({ message: 'Case deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};
