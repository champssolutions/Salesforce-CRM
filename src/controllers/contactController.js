const { getQuery, runQuery } = require('../config/database');

// Normalize a foreign key: empty/undefined/null/"null" or missing parent -> null
const normalizeFk = async (table, value) => {
  if (value === undefined || value === null || value === '' || value === 'null') {
    return null;
  }
  const row = await getQuery(`SELECT id FROM ${table} WHERE id = ?`, [value]);
  return row ? Number(value) : null;
};

// GET /api/contacts
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await getQuery('SELECT * FROM contacts ORDER BY id DESC');
    res.json(contacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/contacts/:id
exports.getContactById = async (req, res) => {
  try {
    const contact = await getQuery('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/accounts/:id/contacts
exports.getContactsByAccountId = async (req, res) => {
  try {
    const accountId = req.params.id;

    const account = await getQuery('SELECT id FROM accounts WHERE id = ?', [accountId]);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const contacts = await getQuery('SELECT * FROM contacts WHERE account_id = ? ORDER BY id DESC', [accountId]);
    res.json(contacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/contacts
exports.createContact = async (req, res) => {
  try {
    const { account_id, first_name, last_name, email, phone, title } = req.body;

    if (!first_name) {
      return res.status(400).json({ error: 'first_name is required' });
    }

    const safeAccountId = await normalizeFk('accounts', account_id);

    const { lastID } = await runQuery(
      'INSERT INTO contacts (account_id, first_name, last_name, email, phone, title) VALUES (?, ?, ?, ?, ?, ?)',
      [safeAccountId, first_name, last_name || null, email || null, phone || null, title || null]
    );

    res.status(201).json({
      id: lastID,
      account_id: safeAccountId,
      first_name,
      last_name: last_name || null,
      email: email || null,
      phone: phone || null,
      title: title || null,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/contacts/:id
exports.updateContact = async (req, res) => {
  try {
    const { account_id, first_name, last_name, email, phone, title } = req.body;

    if (!first_name) {
      return res.status(400).json({ error: 'first_name is required' });
    }

    const contact = await getQuery('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const safeAccountId = (account_id === undefined)
      ? contact.account_id
      : await normalizeFk('accounts', account_id);

    await runQuery(
      'UPDATE contacts SET account_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?, title = ? WHERE id = ?',
      [safeAccountId, first_name, last_name || null, email || null, phone || null, title || null, req.params.id]
    );

    res.json({
      id: Number(req.params.id),
      account_id: safeAccountId,
      first_name,
      last_name: last_name || null,
      email: email || null,
      phone: phone || null,
      title: title || null,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/contacts/:id
exports.deleteContact = async (req, res) => {
  try {
    const { changes } = await runQuery('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    if (changes === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};
