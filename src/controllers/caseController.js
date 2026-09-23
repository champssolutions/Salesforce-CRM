
const { getQuery, runQuery } = require('../config/database');

const execute = async (sql, params = []) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return getQuery(sql, params);
    }
    return runQuery(sql, params);
};

exports.getCases = async (req, res) => {
    try {
        const cases = await execute("SELECT c.*, a.name as account_name, ct.first_name || ' ' || ct.last_name as contact_name FROM cases c LEFT JOIN accounts a ON c.account_id = a.id LEFT JOIN contacts ct ON c.contact_id = ct.id");
        res.json(cases || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.getAllCases = exports.getCases;

exports.getCaseById = async (req, res) => {
    try {
        const cases = await execute("SELECT * FROM cases WHERE id = ?", [req.params.id]);
        res.json(cases[0] || null);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createCase = async (req, res) => {
    try {
        const { subject, description, priority, status, account_id, contact_id } = req.body;
        const result = await execute('INSERT INTO cases (subject, description, priority, status, account_id, contact_id) VALUES (?, ?, ?, ?, ?, ?)', [subject, description || '', priority || 'Medium', status || 'New', account_id || null, contact_id || null]);
        res.json({ id: result.lastID, message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateCase = async (req, res) => {
    try {
        const { subject, description, priority, status, account_id, contact_id } = req.body;
        await execute('UPDATE cases SET subject=?, description=?, priority=?, status=?, account_id=?, contact_id=? WHERE id=?', [subject, description || '', priority || 'Medium', status || 'New', account_id || null, contact_id || null, req.params.id]);
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteCase = async (req, res) => {
    try {
        await execute('DELETE FROM cases WHERE id=?', [req.params.id]);
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
