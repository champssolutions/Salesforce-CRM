const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../../data/app.db');

const execute = (sql, params = []) => new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
        db.all(sql, params, (err, rows) => { db.close(); err ? reject(err) : resolve(rows); });
    } else {
        db.run(sql, params, function(err) { db.close(); err ? reject(err) : resolve(this); });
    }
});

const tableName = 'leads';

exports.getAllLeads = async (req, res) => {
    try {
        const data = await execute(`SELECT * FROM ${tableName}`);
        res.json(data || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getLeadById = async (req, res) => {
    try {
        const data = await execute(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
        res.json(data[0] || null);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createLead = async (req, res) => {
    try {
        const keys = Object.keys(req.body).filter(k => k !== 'id');
        const values = keys.map(k => req.body[k]);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
        const result = await execute(sql, values);
        res.json({ id: result.lastID, message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateLead = async (req, res) => {
    try {
        const keys = Object.keys(req.body).filter(k => k !== 'id');
        const values = keys.map(k => req.body[k]);
        const updates = keys.map(k => `${k}=?`).join(', ');
        const sql = `UPDATE ${tableName} SET ${updates} WHERE id=?`;
        await execute(sql, [...values, req.params.id]);
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteLead = async (req, res) => {
    try {
        await execute(`DELETE FROM ${tableName} WHERE id=?`, [req.params.id]);
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// Fallback aliases สำหรับให้ Router เรียกใช้ได้ทุกท่า
exports.getAll = exports.getAllLeads;
exports.getById = exports.getLeadById;
exports.create = exports.createLead;
exports.update = exports.updateLead;
exports.delete = exports.deleteLead;
