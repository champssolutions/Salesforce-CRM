const db = require('../config/database');

// กำหนดรายการ Stage ที่อนุญาตตาม CHECK constraint ในฐานข้อมูล
const VALID_STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'];

// Promise wrappers for the callback-based sqlite3 API
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});
const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});
const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve({ lastID: this.lastID, changes: this.changes });
  });
});

// Normalize a foreign key: empty/undefined/null/"null" or missing parent -> null
const normalizeFk = async (table, value) => {
  if (value === undefined || value === null || value === '' || value === 'null') {
    return null;
  }
  const row = await get(`SELECT id FROM ${table} WHERE id = ?`, [value]);
  return row ? Number(value) : null;
};

exports.getAllDeals = async (req, res) => {
  try {
    const deals = await all('SELECT * FROM deals ORDER BY id DESC');
    res.json(deals);
  } catch (err) {
    console.error('getAllDeals Error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getDealById = async (req, res) => {
  try {
    const deal = await get('SELECT * FROM deals WHERE id = ?', [req.params.id]);
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

    const { lastID } = await run(sql, params);

    res.status(201).json({
      id: lastID,
      title,
      amount: validAmount,
      stage: finalStage,
      account_id: validAccountId,
      contact_id: validContactId,
      close_date: close_date || null
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

    const deal = await get('SELECT * FROM deals WHERE id = ?', [req.params.id]);
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

    await run(sql, params);

    res.json({
      id: Number(req.params.id),
      title,
      amount: validAmount,
      stage: finalStage,
      account_id: validAccountId,
      contact_id: validContactId,
      close_date: close_date || null
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

    const deal = await get('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    await run('UPDATE deals SET stage = ? WHERE id = ?', [stage, req.params.id]);

    const updated = await get('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error('patchDealStage Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDeal = async (req, res) => {
  try {
    const { changes } = await run('DELETE FROM deals WHERE id = ?', [req.params.id]);
    if (changes === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json({ message: 'Deal deleted' });
  } catch (err) {
    console.error('deleteDeal Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
