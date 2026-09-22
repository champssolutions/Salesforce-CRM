const db = require('../config/database');

// Helper functions
const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
    });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
    });
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
    });
});

exports.createQuote = async (req, res) => {
    try {
        const { deal_id, account_id, items } = req.body;
        
        if (!items || !items.length) {
            return res.status(400).json({ error: 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ' });
        }

        // คำนวณราคารวม
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        // เริ่ม Transaction
        await run('BEGIN TRANSACTION');
        
        // Insert quote
        const { lastID: quoteId } = await run(
            'INSERT INTO quotes (deal_id, account_id, total_amount) VALUES (?, ?, ?)',
            [deal_id, account_id, totalAmount]
        );

        // Insert items
        for (const item of items) {
            await run(
                'INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                [quoteId, item.product_id, item.quantity, item.unit_price, item.total_price]
            );
        }

        await run('COMMIT');
        
        res.status(201).json({ id: quoteId });
    } catch (err) {
        await run('ROLLBACK');
        console.error('Error creating quote:', err);
        res.status(500).json({ 
            error: err.message || 'Failed to create quote',
            details: {
                message: err.message,
                stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
            }
        });
    }
};

exports.getAllQuotes = async (req, res) => {
    try {
        const quotes = await all(`
            SELECT q.*, a.name as account_name, d.title as deal_title 
            FROM quotes q
            LEFT JOIN accounts a ON q.account_id = a.id
            LEFT JOIN deals d ON q.deal_id = d.id
            ORDER BY q.created_at DESC
        `);
        res.json(quotes);
    } catch (err) {
        console.error('Error getting quotes:', err);
        res.status(500).json({ error: 'Failed to get quotes' });
    }
};

exports.getQuoteById = async (req, res) => {
    try {
        const quote = await get(`
            SELECT q.*, a.name as account_name, d.title as deal_title 
            FROM quotes q
            LEFT JOIN accounts a ON q.account_id = a.id
            LEFT JOIN deals d ON q.deal_id = d.id
            WHERE q.id = ?
        `, [req.params.id]);

        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        const items = await all(`
            SELECT qi.*, p.name as product_name, p.code as product_code 
            FROM quote_items qi
            JOIN products p ON qi.product_id = p.id
            WHERE qi.quote_id = ?
        `, [req.params.id]);

        res.json({ ...quote, items });
    } catch (err) {
        console.error('Error getting quote:', err);
        res.status(500).json({ error: 'Failed to get quote' });
    }
};

exports.updateQuoteStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { changes } = await run(
            'UPDATE quotes SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        if (changes === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        res.json({ message: 'Quote status updated' });
    } catch (err) {
        console.error('Error updating quote:', err);
        res.status(500).json({ error: 'Failed to update quote' });
    }
};

exports.deleteQuote = async (req, res) => {
    try {
        const { changes } = await run('DELETE FROM quotes WHERE id = ?', [req.params.id]);
        
        if (changes === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        res.json({ message: 'Quote deleted' });
    } catch (err) {
        console.error('Error deleting quote:', err);
        res.status(500).json({ error: 'Failed to delete quote' });
    }
};
const db = require('../config/database');

// Helper functions
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) return reject(err);
    resolve(rows);
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) return reject(err);
    resolve({ lastID: this.lastID, changes: this.changes });
  });
});

exports.getAllQuotes = async (req, res) => {
  try {
    const quotes = await all(`
      SELECT q.*, d.title as deal_title 
      FROM quotes q
      LEFT JOIN deals d ON q.deal_id = d.id
      ORDER BY q.created_at DESC
    `);
    res.json(quotes);
  } catch (err) {
    console.error('Error getting quotes:', err);
    res.status(500).json({ error: 'Failed to get quotes' });
  }
};

exports.createQuote = async (req, res) => {
  try {
    const { quote_number, deal_id, total_amount, status, expiration_date } = req.body;
    
    if (!quote_number || !deal_id || !total_amount) {
      return res.status(400).json({ error: 'quote_number, deal_id and total_amount are required' });
    }

    const { lastID } = await run(
      'INSERT INTO quotes (quote_number, deal_id, total_amount, status, expiration_date) VALUES (?, ?, ?, ?, ?)',
      [quote_number, deal_id, total_amount, status || 'Draft', expiration_date || null]
    );

    const newQuote = await get('SELECT * FROM quotes WHERE id = ?', [lastID]);
    res.status(201).json(newQuote);
  } catch (err) {
    console.error('Error creating quote:', err);
    res.status(500).json({ error: 'Failed to create quote' });
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const { changes } = await run('DELETE FROM quotes WHERE id = ?', [req.params.id]);
    
    if (changes === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json({ message: 'Quote deleted successfully' });
  } catch (err) {
    console.error('Error deleting quote:', err);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
};
