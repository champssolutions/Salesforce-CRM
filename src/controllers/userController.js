const { db } = require('../config/database');

// Helper สำหรับ query ที่ต้องได้หลาย rows (SELECT ทั่วไป)
const queryAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

exports.getAllUsers = async (req, res) => {
  try {
    const users = await queryAll('SELECT * FROM users');
    res.json(users || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM users WHERE id = ?', [req.params.id]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.createUser = async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
    res.status(201).json({ id: result.lastID, name, email });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.updateUser = async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  try {
    const rows = await queryAll('SELECT * FROM users WHERE id = ?', [req.params.id]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.params.id], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
    res.json({ id: req.params.id, name, email });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM users WHERE id = ?', [req.params.id]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
};
