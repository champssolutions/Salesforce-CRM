// แบบเดิม (better-sqlite3 - sync)
const users = db.prepare('SELECT * FROM users').all();

// แบบใหม่ (sqlite3 - async)
db.all('SELECT * FROM users', (err, users) => { ... });
