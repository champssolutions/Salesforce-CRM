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

// GET /api/tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await all('SELECT * FROM tasks ORDER BY id DESC');
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/:id
exports.getTaskById = async (req, res) => {
  try {
    const taskItem = await get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!taskItem) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(taskItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const { lastID } = await run(
      'INSERT INTO tasks (title, description) VALUES (?, ?)',
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

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const taskItem = await get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!taskItem) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await run(
      'UPDATE tasks SET title = ?, description = ? WHERE id = ?',
      [title, description, req.params.id]
    );

    res.json({
      id: Number(req.params.id),
      title,
      description,
      created_at: taskItem.created_at
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const { changes } = await run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    if (changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};
