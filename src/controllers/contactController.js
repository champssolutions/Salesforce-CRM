const db = require('../config/database');

// GET /api/contacts
exports.getAllContacts = (req, res) => {
  db.all('SELECT * FROM contacts ORDER BY id DESC', [], (err, contacts) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(contacts);
  });
};

// GET /api/contacts/:id
exports.getContactById = (req, res) => {
  db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id], (err, contact) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  });
};

// GET /api/accounts/:id/contacts
exports.getContactsByAccountId = (req, res) => {
  const accountId = req.params.id;

  db.get('SELECT id FROM accounts WHERE id = ?', [accountId], (err, account) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    db.all('SELECT * FROM contacts WHERE account_id = ? ORDER BY id DESC', [accountId], (err, contacts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(contacts);
    });
  });
};

// POST /api/contacts
exports.createContact = (req, res) => {
  const { account_id, first_name, last_name, email, phone } = req.body;

  if (!account_id || !first_name) {
    return res.status(400).json({ error: 'account_id and first_name are required' });
  }

  db.get('SELECT id FROM accounts WHERE id = ?', [account_id], (err, account) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }

    db.run(
      'INSERT INTO contacts (account_id, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?)',
      [account_id, first_name, last_name || null, email || null, phone || null],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({
          id: this.lastID,
          account_id,
          first_name,
          last_name: last_name || null,
          email: email || null,
          phone: phone || null,
        });
      }
    );
  });
};

// PUT /api/contacts/:id
exports.updateContact = (req, res) => {
  const { account_id, first_name, last_name, email, phone } = req.body;

  if (!first_name) {
    return res.status(400).json({ error: 'first_name is required' });
  }

  db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id], (err, contact) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const newAccountId = account_id || contact.account_id;

    db.get('SELECT id FROM accounts WHERE id = ?', [newAccountId], (err, account) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!account) {
        return res.status(400).json({ error: 'Account not found' });
      }

      db.run(
        'UPDATE contacts SET account_id = ?, first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?',
        [newAccountId, first_name, last_name || null, email || null, phone || null, req.params.id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({
            id: Number(req.params.id),
            account_id: newAccountId,
            first_name,
            last_name: last_name || null,
            email: email || null,
            phone: phone || null,
          });
        }
      );
    });
  });
};

// DELETE /api/contacts/:id
exports.deleteContact = (req, res) => {
  db.run('DELETE FROM contacts WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted' });
  });
};
