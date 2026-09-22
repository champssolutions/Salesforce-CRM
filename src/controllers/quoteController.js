const db = require('../config/database');
const { all, get, run } = require('./controllerHelpers');

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
        res.status(500).json({ error: 'Failed to create quote', details: err.message });
    }
};
