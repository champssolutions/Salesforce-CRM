const { getQuery, runQuery } = require('../config/database');

// กำหนดรายการ Stage ที่อนุญาตตาม CHECK constraint ในฐานข้อมูล
const VALID_STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'];

// Normalize a foreign key: empty/undefined/null/"null" or missing parent -> null
const normalizeFk = async (table, value) => {
  if (value === undefined || value === null || value === '' || value === 'null') {
    return null;
  }
  const row = await getQuery(`SELECT id FROM ${table} WHERE id = ?`, [value]);
  return row ? Number(value) : null;
};

exports.getAllDeals = async (req, res) => {
  try {
    const rows = await getQuery('SELECT * FROM deals ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('getAllDeals Error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getDealById = async (req, res) => {
  try {
    const deal = await getQuery('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(deal);
  } catch (err) {
    console.error('getDealById Error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.createDeal = async (req, res) => {
  try {
    const { title, amount, stage, account_id, contact_id, close_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const validAccountId = await normalizeFk('accounts', account_id);
    const validContactId = await normalizeFk('contacts', contact_id);
    const validAmount = amount ? Number(amount) : 0;
    const finalStage = VALID_STAGES.includes(stage) ? stage : 'Prospecting';
    console.log('Deal stage:', finalStage); // For debugging

    const sql = `INSERT INTO deals (title, amount, stage, account_id, contact_id, close_date) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [title, validAmount, finalStage, validAccountId, validContactId, close_date || null];

    const { lastID } = await runQuery(sql, params);
    
    const newDeal = await getQuery('SELECT * FROM deals WHERE id = ?', [lastID]);

    res.status(201).json({
      ...newDeal,
      message: 'Deal created successfully'
    });
  } catch (err) {
    console.error('createDeal Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.updateDeal = async (req, res) => {
  try {
    const { title, amount, stage, account_id, contact_id, close_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const deal = await getQuery('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const validAccountId = (account_id === undefined)
      ? deal.account_id
      : await normalizeFk('accounts', account_id);
    const validContactId = (contact_id === undefined)
      ? deal.contact_id
      : await normalizeFk('contacts', contact_id);
    const validAmount = amount ? Number(amount) : 0;
    const finalStage = VALID_STAGES.includes(stage) ? stage : 'Prospecting';

    const sql = `UPDATE deals SET title = ?, amount = ?, stage = ?, account_id = ?, contact_id = ?, close_date = ? WHERE id = ?`;
    const params = [title, validAmount, finalStage, validAccountId, validContactId, close_date || null, req.params.id];

    await runQuery(sql, params);
    
    const updatedDeal = await getQuery('SELECT * FROM deals WHERE id = ?', [req.params.id]);

    res.json({
      ...updatedDeal,
      message: 'Deal updated successfully'  
    });
  } catch (err) {
    console.error('updateDeal Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/deals/:id/stage — เปลี่ยน Stage ของ Deal (ใช้จาก Kanban board)
exports.patchDealStage = async (req, res) => {
  try {
    const { stage } = req.body;

    if (!VALID_STAGES.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    const deal = await getQuery('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    await runQuery('UPDATE deals SET stage = ? WHERE id = ?', [stage, req.params.id]);

    const updated = await getQuery('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error('patchDealStage Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDeal = async (req, res) => {
  try {
    const { changes } = await runQuery('DELETE FROM deals WHERE id = ?', [req.params.id]);
    if (changes === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json({ message: 'Deal deleted' });
  } catch (err) {
    console.error('deleteDeal Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
