const { getQuery, runQuery } = require('../config/database');

function normalizeFk(val) {
    if (val === null || val === undefined || val === '' || val === 'null' || val === 'undefined') {
        return null;
    }
    const num = Number(val);
    return isNaN(num) ? null : num;
}

exports.getAllCases = async (req, res) => {
  try {
    const rows = await getQuery(`
      SELECT c.*, a.name as account_name, ct.first_name as contact_first_name, ct.last_name as contact_last_name
      FROM cases c
      LEFT JOIN accounts a ON c.account_id = a.id
      LEFT JOIN contacts ct ON c.contact_id = ct.id
      ORDER BY c.created_at DESC
    `);
    res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error('Error getting cases:', err);
    res.status(500).json({ error: 'Failed to get cases' });
  }
};

exports.getCaseById = async (req, res) => {
  try {
    const caseItem = await getQuery(`
      SELECT c.*, a.name as account_name, ct.first_name as contact_first_name, ct.last_name as contact_last_name
      FROM cases c
      LEFT JOIN accounts a ON c.account_id = a.id
      LEFT JOIN contacts ct ON c.contact_id = ct.id
      WHERE c.id = ?
    `, [req.params.id]);
    
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(caseItem);
  } catch (err) {
    console.error('Error getting case:', err);
    res.status(500).json({ error: 'Failed to get case' });
  }
};

exports.createCase = async (req, res) => {
  try {
    const { subject, account_id, contact_id, description, priority, status } = req.body;
    
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    const safeAccountId = normalizeFk(account_id);
    const safeContactId = normalizeFk(contact_id);

    const { lastID } = await runQuery(
      'INSERT INTO cases (subject, account_id, contact_id, description, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
      [subject, safeAccountId, safeContactId, description || '', priority || 'Medium', status || 'New']
    );

    const newCase = await getQuery('SELECT * FROM cases WHERE id = ?', [lastID]);
    res.status(201).json(newCase);
  } catch (err) {
    console.error('Error creating case:', err);
    res.status(500).json({ error: 'Failed to create case', details: err.message });
  }
};

exports.updateCase = async (req, res) => {
  try {
    const { subject, account_id, contact_id, description, priority, status } = req.body;
    
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    const safeAccountId = normalizeFk(account_id);
    const safeContactId = normalizeFk(contact_id);

    const { changes } = await runQuery(
      'UPDATE cases SET subject = ?, account_id = ?, contact_id = ?, description = ?, priority = ?, status = ? WHERE id = ?',
      [subject, safeAccountId, safeContactId, description || '', priority || 'Medium', status || 'New', req.params.id]
    );

    if (changes === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const updatedCase = await getQuery('SELECT * FROM cases WHERE id = ?', [req.params.id]);
    res.json(updatedCase);
  } catch (err) {
    console.error('Error updating case:', err);
    res.status(500).json({ error: 'Failed to update case', details: err.message });
  }
};

exports.deleteCase = async (req, res) => {
  try {
    const { changes } = await runQuery('DELETE FROM cases WHERE id = ?', [req.params.id]);
    
    if (changes === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ message: 'Case deleted successfully' });
  } catch (err) {
    console.error('Error deleting case:', err);
    res.status(500).json({ error: 'Failed to delete case', details: err.message });
  }
};
