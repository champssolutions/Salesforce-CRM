const { getQuery, runQuery } = require('../config/database');

exports.createQuote = async (req, res) => {
    try {
        const { deal_id, account_id, items = [], status = 'Draft' } = req.body;

        // คำนวณราคารวม (จะได้ 0 ถ้าไม่มี items)
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        // เริ่ม Transaction
        await runQuery('BEGIN TRANSACTION');
        
        // Insert quote
        const { lastID: quoteId } = await runQuery(
            'INSERT INTO quotes (deal_id, account_id, total_amount, status) VALUES (?, ?, ?, ?)',
            [deal_id, account_id, totalAmount, status]
        );

        // Insert items
        for (const item of items) {
            await runQuery(
                'INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                [quoteId, item.product_id, item.quantity, item.unit_price, item.total_price]
            );
        }

        await runQuery('COMMIT');
        
        res.status(201).json({ id: quoteId });
    } catch (err) {
        await runQuery('ROLLBACK');
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
        const quotes = await getQuery(`
            SELECT q.*, d.title as deal_title, a.name as account_name
            FROM quotes q
            LEFT JOIN deals d ON q.deal_id = d.id
            LEFT JOIN accounts a ON d.account_id = a.id
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
        const quote = await getQuery(`
            SELECT q.*, a.name as account_name, d.title as deal_title 
            FROM quotes q
            LEFT JOIN accounts a ON q.account_id = a.id
            LEFT JOIN deals d ON q.deal_id = d.id
            WHERE q.id = ?
        `, [req.params.id]);

        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        const items = await getQuery(`
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
        const { status = 'Draft' } = req.body;
        const { changes } = await runQuery(
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
        const { changes } = await runQuery('DELETE FROM quotes WHERE id = ?', [req.params.id]);
        
        if (changes === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        res.json({ message: 'Quote deleted' });
    } catch (err) {
        console.error('Error deleting quote:', err);
        res.status(500).json({ error: 'Failed to delete quote' });
    }
};
