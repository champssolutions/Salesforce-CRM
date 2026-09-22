const { getQuery, runQuery } = require('../config/database');

// GET /api/accounts?page=1&limit=10&search=xxx
exports.getAllAccounts = async (req, res) => {
  try {
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

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM accounts ${whereClause}`;
    const countResult = await getQuery(countQuery, params);
    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    // Get paginated data
    const dataQuery = `SELECT * FROM accounts ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const dataParams = [...params, limit, offset];
    const accounts = await getQuery(dataQuery, dataParams);

    res.json({
      data: accounts,
      pagination: { page, limit, total, totalPages }
    });
  } catch (err) {
    console.error('Error getting accounts:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// GET /api/accounts/:id
exports.getAccountById = async (req, res) => {
  try {
    const account = await getQuery('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(account);
  } catch (err) {
    console.error('Error getting account:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// POST /api/accounts
exports.createAccount = async (req, res) => {
  try {
    const { name, industry, phone, website } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const { lastID } = await runQuery(
      'INSERT INTO accounts (name, industry, phone, website) VALUES (?, ?, ?, ?)',
      [name, industry || null, phone || null, website || null]
    );

    res.status(201).json({
      id: lastID,
      name,
      industry: industry || null,
      phone: phone || null,
      website: website || null,
    });
  } catch (err) {
    console.error('Error creating account:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// PUT /api/accounts/:id (Full Replace)
exports.updateAccount = async (req, res) => {
  try {
    const { name, industry, phone, website } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const account = await getQuery('SELECT id FROM accounts WHERE id = ?', [req.params.id]);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await runQuery(
      'UPDATE accounts SET name = ?, industry = ?, phone = ?, website = ? WHERE id = ?',
      [name, industry || null, phone || null, website || null, req.params.id]
    );

    res.json({
      id: Number(req.params.id),
      name,
      industry: industry || null,
      phone: phone || null,
      website: website || null,
    });
  } catch (err) {
    console.error('Error updating account:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// PATCH /api/accounts/:id (Partial Update)
exports.patchAccount = (req, res) => {
  const { name, industry, phone, website } = req.body;

  // Collect only the fields that were provided
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (industry !== undefined) fields.industry = industry;
  if (phone !== undefined) fields.phone = phone;
  if (website !== undefined) fields.website = website;

  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ error: 'At least one field must be provided' });
  }

  // If name is provided, it must not be empty
  if (fields.name !== undefined && !fields.name) {
    return res.status(400).json({ error: 'name cannot be empty' });
  }

  // Check if account exists
  db.get('SELECT * FROM accounts WHERE id = ?', [req.params.id], (err, account) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Build dynamic SET clause
    const setClauses = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      setClauses.push(`${key} = ?`);
      values.push(value || null);
    }
    values.push(req.params.id);

    const query = `UPDATE accounts SET ${setClauses.join(', ')} WHERE id = ?`;

    db.run(query, values, function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Build response with merged values
      const updated = {
        id: Number(req.params.id),
        name: fields.name !== undefined ? fields.name : account.name,
        industry: fields.industry !== undefined ? (fields.industry || null) : account.industry,
        phone: fields.phone !== undefined ? (fields.phone || null) : account.phone,
        website: fields.website !== undefined ? (fields.website || null) : account.website,
      };
      res.json(updated);
    });
  });
};

// DELETE /api/accounts/:id
exports.deleteAccount = async (req, res) => {
  try {
    const { changes } = await runQuery('DELETE FROM accounts WHERE id = ?', [req.params.id]);
    if (changes === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Database error' });
  }
};
