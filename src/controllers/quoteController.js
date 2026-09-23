const { getQuery, runQuery } = require('../config/database');

const tableName = 'quotes';

exports.getAllQuotes = async (req, res) => {
    try {
        const quotes = await getQuery(`SELECT q.*, d.title as deal_title FROM ${tableName} q LEFT JOIN deals d ON d.id = q.deal_id`);
        const items = await getQuery(`SELECT qi.*, COALESCE(p.name, qi.product_name) as product_name FROM quote_items qi LEFT JOIN products p ON p.id = qi.product_id`);
        const result = quotes.map(q => ({
            ...q,
            quote_items: items.filter(i => i.quote_id === q.id)
        }));
        res.json(result || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getQuoteById = async (req, res) => {
    try {
        const data = await getQuery(`SELECT q.*, d.title as deal_title FROM ${tableName} q LEFT JOIN deals d ON d.id = q.deal_id WHERE q.id = ?`, [req.params.id]);
        const quote = data[0] || null;
        if (!quote) return res.json(null);

        const items = await getQuery(
            `SELECT qi.*, COALESCE(p.name, qi.product_name) as product_name FROM quote_items qi LEFT JOIN products p ON p.id = qi.product_id WHERE qi.quote_id = ?`,
            [quote.id]
        );
        res.json({ ...quote, quote_items: items });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createQuote = async (req, res) => {
    try {
        const { quote_number, deal_id, total_amount = 0, status = 'Draft', expiration_date, quote_items: items = [] } = req.body;

        // Calculate total amount from line items if not provided
        let calculatedTotal = Number(total_amount);
        if (items.length > 0 && calculatedTotal === 0) {
            calculatedTotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
        }

        // Create the quote first
        const insertSql = `INSERT INTO ${tableName} (quote_number, deal_id, total_amount, status, expiration_date) VALUES (?, ?, ?, ?, ?)`;
        const result = await runQuery(insertSql, [quote_number, deal_id || null, calculatedTotal, status, expiration_date || null]);
        const quoteId = result.lastID;

        // Add quote items if provided
        if (items.length > 0) {
            for (const item of items) {
                // Get product name if product_id is provided
                let productName = item.product_name || '';
                if (item.product_id && !productName) {
                    const productData = await getQuery('SELECT name FROM products WHERE id = ?', [item.product_id]);
                    if (productData.length > 0) {
                        productName = productData[0].name;
                    }
                }
                
                await runQuery(
                    'INSERT INTO quote_items (quote_id, product_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        quoteId,
                        item.product_id || null,
                        productName,
                        item.quantity || 1,
                        item.unit_price || 0,
                        (item.quantity || 1) * (item.unit_price || 0)
                    ]
                );
            }
        }

        res.json({ id: quoteId, message: 'Quote created successfully' });
    } catch (err) {
        console.error('Error creating quote:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateQuote = async (req, res) => {
    try {
        const keys = Object.keys(req.body).filter(k => k !== 'id' && k !== 'quote_items');
        const values = keys.map(k => req.body[k]);
        const updates = keys.map(k => `${k}=?`).join(', ');
        const sql = `UPDATE ${tableName} SET ${updates} WHERE id=?`;
        await runQuery(sql, [...values, req.params.id]);
        res.json({ message: 'Quote updated successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteQuote = async (req, res) => {
    try {
        // Delete quote items first (CASCADE should handle this, but being explicit)
        await runQuery('DELETE FROM quote_items WHERE quote_id = ?', [req.params.id]);
        // Delete the quote
        await runQuery(`DELETE FROM ${tableName} WHERE id=?`, [req.params.id]);
        res.json({ message: 'Quote deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// Fallback aliases สำหรับให้ Router เรียกใช้ได้ทุกท่าexports.getAll = exports.getAllQuotes;
exports.getById = exports.getQuoteById;
exports.create = exports.createQuote;
exports.update = exports.updateQuote;
exports.delete = exports.deleteQuote;
