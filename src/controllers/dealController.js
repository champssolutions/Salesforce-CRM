const db = require('../config/database');

// GET /api/deals
exports.getAllDeals = (req, res) => {
  db.all('SELECT * FROM deals ORDER BY id DESC', [], (err, deals) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(deals);
  });
};

// GET /api/deals/:id
exports.getDealById = (req, res) => {
  db.get('SELECT * FROM deals WHERE id = ?', [req.params.id], (err, deal) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(deal);
  });
};

// GET /api/deals/account/:accountId
exports.getDealsByAccountId = (req, res) => {
  const accountId = req.params.id;

  db.get('SELECT id FROM accounts WHERE id = ?', [accountId], (err, account) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    db.all('SELECT * FROM deals WHERE account_id = ? ORDER BY id DESC', [accountId], (err, deals) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(deals);
    });
  });
};

// POST /api/deals
exports.createDeal = (req, res) => {
  const { title, amount, stage, account_id, contact_id, close_date } = req.body;

  if (!title || !amount || !stage) {
    return res.status(400).json({ error: 'title, amount, and stage are required' });
  }

  db.get('SELECT id FROM accounts WHERE id = ?', [account_id], (err, account) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }

    db.get('SELECT id FROM contacts WHERE id = ?', [contact_id], (err, contact) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!contact) {
        return res.status(400).json({ error: 'Contact not found' });
      }

      db.run(
        'INSERT INTO deals (title, amount, stage, account_id, contact_id, close_date) VALUES (?, ?, ?, ?, ?, ?)',
        [title, amount, stage, account_id, contact_id, close_date || null],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({
            id: this.lastID,
            title,
            amount,
            stage,
            account_id,
            contact_id,
            close_date: close_date || null,
          });
        }
      );
    });
  });
};

// PUT /api/deals/:id
exports.updateDeal = (req, res) => {
  const { title, amount, stage, account_id, contact_id, close_date } = req.body;

  if (!title || !amount || !stage) {
    return res.status(400).json({ error: 'title, amount, and stage are required' });
  }

  db.get('SELECT * FROM deals WHERE id = ?', [req.params.id], (err, deal) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const newAccountId = account_id || deal.account_id;
    const newContactId = contact_id || deal.contact_id;

    db.get('SELECT id FROM accounts WHERE id = ?', [newAccountId], (err, account) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!account) {
        return res.status(400).json({ error: 'Account not found' });
      }

      db.get('SELECT id FROM contacts WHERE id = ?', [newContactId], (err, contact) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!contact) {
          return res.status(400).json({ error: 'Contact not found' });
        }

        db.run(
          'UPDATE deals SET title = ?, amount = ?, stage = ?, account_id = ?, contact_id = ?, close_date = ? WHERE id = ?',
          [title, amount, stage, newAccountId, newContactId, close_date || null, req.params.id],
          function (err) {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({
              id: Number(req.params.id),
              title,
              amount,
              stage,
              account_id: newAccountId,
              contact_id: newContactId,
              close_date: close_date || null,
            });
          }
        );
      });
    });
  });
};

// PATCH /api/deals/:id
exports.patchDeal = (req, res) => {
  const { title, amount, stage, account_id, contact_id, close_date } = req.body;

  const fields = {};
  if (title !== undefined) fields.title = title;
  if (amount !== undefined) fields.amount = amount;
  if (stage !== undefined) fields.stage = stage;
  if (account_id !== undefined) fields.account_id = account_id;
  if (contact_id !== undefined) fields.contact_id = contact_id;
  if (close_date !== undefined) fields.close_date = close_date;

  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ error: 'At least one field must be provided' });
  }

  db.get('SELECT * FROM deals WHERE id = ?', [req.params.id], (err, deal) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const setClauses = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      setClauses.push(`${key} = ?`);
      values.push(value !== undefined ? value : null);
    }
    values.push(req.params.id);

    const query = `UPDATE deals SET ${setClauses.join(', ')} WHERE id = ?`;

    db.run(query, values, function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const updated = {
        id: Number(req.params.id),
        title: fields.title !== undefined ? fields.title : deal.title,
        amount: fields.amount !== undefined ? fields.amount : deal.amount,
        stage: fields.stage !== undefined ? fields.stage : deal.stage,
        account_id: fields.account_id !== undefined ? fields.account_id : deal.account_id,
        contact_id: fields.contact_id !== undefined ? fields.contact_id : deal.contact_id,
        close_date: fields.close_date !== undefined ? fields.close_date : deal.close_date,
      };
      res.json(updated);
    });
  });
};

// DELETE /api/deals/:id
exports.deleteDeal = (req, res) => {
  db.run('DELETE FROM deals WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json({ message: 'Deal deleted' });
  });
};
