const db = require('../config/database');

// Helper functions
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
  db.run(sql, params, function(err) {
    if (err) return reject(err);
    resolve({ lastID: this.lastID, changes: this.changes });
  });
});

function normalizeFk(val) {
    if (val === null || val === undefined || val === '' || val === 'null' || val === 'undefined') {
        return null;
    }
    const num = Number(val);
    return isNaN(num) ? null : num;
}

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await all(`
      SELECT t.*, d.title as deal_title, 
             c.first_name as contact_first_name, c.last_name as contact_last_name
      FROM tasks t
      LEFT JOIN deals d ON t.deal_id = d.id
      LEFT JOIN contacts c ON t.contact_id = c.id
      ORDER BY t.due_date ASC, t.created_at DESC
    `);
    res.json(tasks);
  } catch (err) {
    console.error('Error getting tasks:', err);
    res.status(500).json({ error: 'Failed to get tasks', details: err.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await get(`
      SELECT t.*, d.title as deal_title, 
             c.first_name as contact_first_name, c.last_name as contact_last_name
      FROM tasks t
      LEFT JOIN deals d ON t.deal_id = d.id
      LEFT JOIN contacts c ON t.contact_id = c.id
      WHERE t.id = ?
    `, [req.params.id]);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    console.error('Error getting task:', err);
    res.status(500).json({ error: 'Failed to get task', details: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, due_date, status, priority, deal_id, contact_id } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const safeDealId = normalizeFk(deal_id);
    const safeContactId = normalizeFk(contact_id);

    const { lastID } = await run(
      'INSERT INTO tasks (title, description, due_date, status, priority, deal_id, contact_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', due_date || null, status || 'Not Started', priority || 'Medium', safeDealId, safeContactId]
    );

    const newTask = await get('SELECT * FROM tasks WHERE id = ?', [lastID]);
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, due_date, status, priority, deal_id, contact_id } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const safeDealId = normalizeFk(deal_id);
    const safeContactId = normalizeFk(contact_id);

    const { changes } = await run(
      'UPDATE tasks SET title = ?, description = ?, due_date = ?, status = ?, priority = ?, deal_id = ?, contact_id = ? WHERE id = ?',
      [title, description || '', due_date || null, status || 'Not Started', priority || 'Medium', safeDealId, safeContactId, req.params.id]
    );

    if (changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task', details: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { changes } = await run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    
    if (changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
};
