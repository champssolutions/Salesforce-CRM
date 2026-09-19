const db = require('../config/database');

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
      [title, description || '']
    );

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