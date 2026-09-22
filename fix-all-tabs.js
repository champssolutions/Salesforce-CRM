const fs = require('fs');
const path = require('path');

// รายชื่อแท็บที่ต้องการซ่อม
const controllers = ['account', 'lead', 'contact', 'task', 'product', 'deal', 'quote'];

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ฟังก์ชันสร้างโค้ด Controller แบบต่อตรง ไม่ต้องง้อไฟล์ Config
const getControllerCode = (name) => `const sqlite3 = require('sqlite3').verbose();
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

const tableName = '${name}s';

exports.getAll${capitalize(name)}s = async (req, res) => {
    try {
        const data = await execute(\`SELECT * FROM \${tableName}\`);
        res.json(data || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.get${capitalize(name)}ById = async (req, res) => {
    try {
        const data = await execute(\`SELECT * FROM \${tableName} WHERE id = ?\`, [req.params.id]);
        res.json(data[0] || null);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create${capitalize(name)} = async (req, res) => {
    try {
        const keys = Object.keys(req.body).filter(k => k !== 'id');
        const values = keys.map(k => req.body[k]);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = \`INSERT INTO \${tableName} (\${keys.join(', ')}) VALUES (\${placeholders})\`;
        const result = await execute(sql, values);
        res.json({ id: result.lastID, message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update${capitalize(name)} = async (req, res) => {
    try {
        const keys = Object.keys(req.body).filter(k => k !== 'id');
        const values = keys.map(k => req.body[k]);
        const updates = keys.map(k => \`\${k}=?\`).join(', ');
        const sql = \`UPDATE \${tableName} SET \${updates} WHERE id=?\`;
        await execute(sql, [...values, req.params.id]);
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.delete${capitalize(name)} = async (req, res) => {
    try {
        await execute(\`DELETE FROM \${tableName} WHERE id=?\`, [req.params.id]);
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// Fallback aliases สำหรับให้ Router เรียกใช้ได้ทุกท่า
exports.getAll = exports.getAll${capitalize(name)}s;
exports.getById = exports.get${capitalize(name)}ById;
exports.create = exports.create${capitalize(name)};
exports.update = exports.update${capitalize(name)};
exports.delete = exports.delete${capitalize(name)};
`;

// ทำการเขียนทับไฟล์ Controller ทั้งหมด
controllers.forEach(name => {
    const filePath = path.join(__dirname, 'src', 'controllers', `${name}Controller.js`);
    fs.writeFileSync(filePath, getControllerCode(name));
    console.log(`✅ Fixed & Isolated: ${name}Controller.js`);
});

console.log("🎉 All remaining tabs have been fixed!");