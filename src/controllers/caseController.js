const db = require('../config/database');

// Promise wrappers for the callback-based sqlite3 API
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});
const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});
const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve({ lastID: this.lastID, changes: this.changes });
  });
});

// Normalize a foreign key: empty/undefined/null/"null" or missing parent -> null
const normalizeFk = async (table, value) => {
  if (value === undefined || value === null || value === '' || value === 'null') {
    return null;
  }
  const row = await get(`SELECT id FROM ${table} WHERE id = ?`, [value]);
  return row ? Number(value) : null;
};

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
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const { lastID } = await run(
      'INSERT INTO cases (title, description) VALUES (?, ?)',
      [title, description]
    );

    res.status(201).json({
      id: lastID,
      title,
      description,
      created_at: new Date().toISOString()
    });
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
      [title, description, req.params.id]
    );

    res.json({
      id: Number(req.params.id),
      title,
      description,
      created_at: caseItem.created_at
    });
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
    res.json({ message: 'Case deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};
