const db = require('../config/database');

exports.getAllOpportunities = (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  let whereClause = '';
  const params = [];

  if (search) {
    whereClause = 'WHERE name LIKE ?';
    params.push(`%${search}%`);
  }

  db.all(`SELECT * FROM opportunities ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limit, offset], (err, opportunities) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(opportunities);
  });
};

exports.getOpportunityById = (req, res) => {
  db.get('SELECT * FROM opportunities WHERE id = ?', [req.params.id], (err, opportunity) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    res.json(opportunity);
  });
};

exports.createOpportunity = (req, res) => {
  const { account_id, name, amount, stage, close_date } = req.body;

  if (!account_id || !name || !stage) {
    return res.status(400).json({ error: 'account_id, name, and stage are required' });
  }

  db.get('SELECT id FROM accounts WHERE id = ?', [account_id], (err, account) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    db.run(
      'INSERT INTO opportunities (account_id, name, amount, stage, close_date) VALUES (?, ?, ?, ?, ?)',
      [account_id, name, amount || null, stage, close_date || null],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: this.lastID, account_id, name, amount, stage, close_date });
      }
    );
  });
};

exports.updateOpportunity = (req, res) => {
  const { account_id, name, amount, stage, close_date } = req.body;

  if (!name || !stage) {
    return res.status(400).json({ error: 'name and stage are required' });
  }

  db.get('SELECT * FROM opportunities WHERE id = ?', [req.params.id], (err, opportunity) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    db.run(
      'UPDATE opportunities SET account_id = ?, name = ?, amount = ?, stage = ?, close_date = ? WHERE id = ?',
      [account_id || opportunity.account_id, name, amount || null, stage, close_date || null, req.params.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ id: req.params.id, account_id, name, amount, stage, close_date });
      }
    );
  });
};

exports.patchOpportunity = (req, res) => {
  const { account_id, name, amount, stage, close_date } = req.body;

  const fields = {};
  if (account_id !== undefined) fields.account_id = account_id;
  if (name !== undefined) fields.name = name;
  if (amount !== undefined) fields.amount = amount;
  if (stage !== undefined) fields.stage = stage;
  if (close_date !== undefined) fields.close_date = close_date;

  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ error: 'At least one field must be provided' });
  }

  db.get('SELECT * FROM opportunities WHERE id = ?', [req.params.id], (err, opportunity) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const updateFields = Object.keys(fields).map(field => `${field} = ?`).join(', ');
    const values = Object.values(fields);
    values.push(req.params.id);

    db.run(`UPDATE opportunities SET ${updateFields} WHERE id = ?`, values, function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: req.params.id, ...fields });
    });
  });
};

exports.deleteOpportunity = (req, res) => {
  db.run('DELETE FROM opportunities WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    res.json({ message: 'Opportunity deleted' });
  });
};
