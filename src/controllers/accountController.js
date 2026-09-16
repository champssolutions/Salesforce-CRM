const db = require('../config/database');

// GET /api/accounts
exports.getAllAccounts = (req, res) => {
  db.all('SELECT * FROM accounts ORDER BY id DESC', [], (err, accounts) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(accounts);
  });
};

// GET /api/accounts/:id
exports.getAccountById = (req, res) => {
  db.get('SELECT * FROM accounts WHERE id = ?', [req.params.id], (err, account) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(account);
  });
};

// POST /api/accounts
exports.createAccount = (req, res) => {
  const { name, industry, phone, website } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  db.run(
    'INSERT INTO accounts (name, industry, phone, website) VALUES (?, ?, ?, ?)',
    [name, industry || null, phone || null, website || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        industry: industry || null,
        phone: phone || null,
        website: website || null,
      });
    }
  );
};

// PUT /api/accounts/:id
exports.updateAccount = (req, res) => {
  const { name, industry, phone, website } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  db.run(
    'UPDATE accounts SET name = ?, industry = ?, phone = ?, website = ? WHERE id = ?',
    [name, industry || null, phone || null, website || null, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }
      res.json({
        id: Number(req.params.id),
        name,
        industry: industry || null,
        phone: phone || null,
        website: website || null,
      });
    }
  );
};

// DELETE /api/accounts/:id
exports.deleteAccount = (req, res) => {
  db.run('DELETE FROM accounts WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json({ message: 'Account deleted' });
  });
};
