const { getQuery, runQuery } = require('../config/database');

const execute = async (sql, params = []) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return getQuery(sql, params);
    }
    return runQuery(sql, params);
};

const tableName = 'deals';

exports.getAllDeals = async (req, res) => {
    try {
        const data = await execute(`SELECT * FROM ${tableName}`);
        res.json(data || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getDealById = async (req, res) => {
    try {
        const data = await execute(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
        res.json(data[0] || null);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createDeal = async (req, res) => {
    try {
        const keys = Object.keys(req.body).filter(k => k !== 'id');
        const values = keys.map(k => req.body[k]);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
        const result = await execute(sql, values);
        res.json({ id: result.lastID, message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateDeal = async (req, res) => {
    try {
        const keys = Object.keys(req.body).filter(k => k !== 'id');
        const values = keys.map(k => req.body[k]);
        const updates = keys.map(k => `${k}=?`).join(', ');
        const sql = `UPDATE ${tableName} SET ${updates} WHERE id=?`;
        await execute(sql, [...values, req.params.id]);
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteDeal = async (req, res) => {
    try {
        await execute(`DELETE FROM ${tableName} WHERE id=?`, [req.params.id]);
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// Fallback aliases สำหรับให้ Router เรียกใช้ได้ทุกท่า
exports.getAll = exports.getAllDeals;
exports.getById = exports.getDealById;
exports.create = exports.createDeal;
exports.update = exports.updateDeal;
exports.delete = exports.deleteDeal;
