const db = require('../config/database');

exports.getAllDeals = async (req, res) => {
  try {
    const deals = await db.all('SELECT * FROM deals');
    res.json(deals);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getDealById = async (req, res) => {
  try {
    const deal = await db.get('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(deal);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.createDeal = async (req, res) => {
  const { title, amount, stage, account_id, contact_id, close_date } = req.body;

  if (!title || !amount || !stage) {
    return res.status(400).json({ error: 'title, amount, and stage are required' });
  }

  try {
    const stmt = await db.prepare('INSERT INTO deals (title, amount, stage, account_id, contact_id, close_date) VALUES (?, ?, ?, ?, ?, ?)');
    const { lastID } = await stmt.run(title, amount, stage, account_id, contact_id, close_date);
    stmt.finalize();
    res.status(201).json({ id: lastID, title, amount, stage, account_id, contact_id, close_date });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.updateDeal = async (req, res) => {
  const { title, amount, stage, account_id, contact_id, close_date } = req.body;

  if (!title || !amount || !stage) {
    return res.status(400).json({ error: 'title, amount, and stage are required' });
  }

  try {
    const deal = await db.get('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const stmt = await db.prepare('UPDATE deals SET title = ?, amount = ?, stage = ?, account_id = ?, contact_id = ?, close_date = ? WHERE id = ?');
    await stmt.run(title, amount, stage, account_id, contact_id, close_date, req.params.id);
    stmt.finalize();
    res.json({ id: req.params.id, title, amount, stage, account_id, contact_id, close_date });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.deleteDeal = async (req, res) => {
  try {
    const deal = await db.get('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const stmt = await db.prepare('DELETE FROM deals WHERE id = ?');
    await stmt.run(req.params.id);
    stmt.finalize();
    res.json({ message: 'Deal deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
};
