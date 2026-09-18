const db = require('../config/database');

// GET /api/contacts
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await db.all('SELECT * FROM contacts ORDER BY id DESC');
    res.json(contacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/contacts/:id
exports.getContactById = async (req, res) => {
  try {
    const contact = await db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
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

    const account = await db.get('SELECT id FROM accounts WHERE id = ?', [accountId]);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const contacts = await db.all('SELECT * FROM contacts WHERE account_id = ? ORDER BY id DESC', [accountId]);
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

    if (!account_id || !first_name) {
      return res.status(400).json({ error: 'account_id and first_name are required' });
    }

    const account = await db.get('SELECT id FROM accounts WHERE id = ?', [account_id]);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }

    const stmt = await db.prepare('INSERT INTO contacts (account_id, first_name, last_name, email, phone, title) VALUES (?, ?, ?, ?, ?, ?)');
    const { lastID } = await stmt.run(account_id, first_name, last_name || null, email || null, phone || null, title || null);
    stmt.finalize();
    res.status(201).json({
      id: lastID,
      account_id,
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

    const contact = await db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const newAccountId = account_id || contact.account_id;

    const account = await db.get('SELECT id FROM accounts WHERE id = ?', [newAccountId]);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }

    const stmt = await db.prepare('UPDATE contacts SET account_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?, title = ? WHERE id = ?');
    await stmt.run(newAccountId, first_name, last_name || null, email || null, phone || null, title || null, req.params.id);
    stmt.finalize();
    res.json({
      id: Number(req.params.id),
      account_id: newAccountId,
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
    const stmt = await db.prepare('DELETE FROM contacts WHERE id = ?');
    const result = await stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};
