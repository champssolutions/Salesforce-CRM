const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'crm.db');

// Stale -shm/-wal files can cause IOERR on startup on Windows.
// Try to remove them before opening the DB.
function removeStaleWalFiles() {
  try {
    const shm = dbPath + '-shm';
    const wal = dbPath + '-wal';
    try { fs.unlinkSync(shm); } catch {}
    try { fs.unlinkSync(wal); } catch {}
  } catch {}
}
removeStaleWalFiles();

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Configure durable journaling with F_FULLSYNC semantics so writes can land in this environment.
db.serialize(() => {
  try { db.run('PRAGMA journal_mode = WAL'); } catch {}
  try { db.run('PRAGMA synchronous = FULL'); } catch {}
  try { db.run('PRAGMA full_fsync = FULLSYNC'); } catch {}
  console.log('journal_mode set');
});

// Small delay to let WAL initialization settle on this environment.
setTimeout(() => { try { db.run('PRAGMA wal_checkpoint = FULL'); } catch {} }, 10);

// Expose a helper for forced checkpoint + sync after setup.
function checkpointNow() {
  db.run('PRAGMA wal_checkpoint = FULL', function(err) {
    if (err) console.warn('wal_checkpoint FULL failed', err);
    else console.log('wal_checkpoint FULL completed');
  });
}

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Helper function สำหรับรันคำสั่ง SQL รูปแบบ Promise (ช่วยแก้ปัญหาปีกกาซ้อนกัน)

const setupDatabase = async () => {
  try {
    await runQuery('PRAGMA journal_mode = WAL');
    await runQuery('PRAGMA synchronous = NORMAL');
    await runQuery('PRAGMA foreign_keys = ON');
    await runQuery('PRAGMA cache_size = -20000');
    await runQuery('PRAGMA temp_store = MEMORY');

    // สร้างตารางพื้นฐาน
    await runQuery(`CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      industry TEXT,
      phone TEXT,
      website TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    console.log('accounts table created');

    await runQuery(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      price REAL,
      description TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    console.log('products table created');

    await runQuery(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'User',
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    console.log('users table created');

    await runQuery(`CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT,
      company TEXT,
      status TEXT DEFAULT 'New',
      email TEXT,
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    console.log('leads table created');

    // สร้างตารางที่มี Foreign Key
    await runQuery(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      first_name TEXT NOT NULL,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      title TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    console.log('contacts table created');

    await runQuery(`CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL,
      stage TEXT CHECK (stage IN ('Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost')),
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
      close_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      amount REAL,
      stage TEXT CHECK (stage IN ('Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost')),
      close_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
      subject TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'New',
      priority TEXT DEFAULT 'Medium',
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
      contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      status TEXT DEFAULT 'Not Started',
      priority TEXT DEFAULT 'Medium',
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_number TEXT UNIQUE NOT NULL,
      deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected')),
      expiration_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
      unit_price REAL NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
      total_price REAL NOT NULL DEFAULT 0 CHECK (total_price >= 0),
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    
    console.log('quote_items table created');

    // สร้าง Admin เริ่มต้นถ้ายังไม่มี
    const userCount = await getQuery("SELECT COUNT(*) as count FROM users");
    if (userCount && userCount.count === 0) {
      // เข้ารหัสผ่านก่อนบันทึก
      const hashedPassword = bcrypt.hashSync('admin', 10);

      await runQuery("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ['admin', hashedPassword, 'Admin']);
      console.log('Default admin user created');
    } else {
      // ตรวจสอบว่ามีรหัสผ่านที่ไม่ถูกต้องหรือไม่
      const adminUser = await getQuery("SELECT password FROM users WHERE username = 'admin'");
      if (adminUser && adminUser.password && !adminUser.password.startsWith('$2b$')) {
        const hashedPassword = bcrypt.hashSync('admin', 10);
        await runQuery("UPDATE users SET password = ? WHERE username = 'admin'", [hashedPassword]);
        console.log('Updated admin password hash');
      }
    }

    return true;
  } catch (err) {
    console.error('Error setting up database:', err.message);
    return false;
  }
};

/**
 * Safely adds columns to existing tables
 */
async function ensureColumns(table, columns) {
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${table})`, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    const existing = new Set(rows.map((row) => row.name));
    const missing = columns.filter(([name]) => !existing.has(name));

    if (missing.length === 0) return true;

    for (const [name, definition] of missing) {
      await runQuery(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
      console.log(`Migration: added column ${table}.${name}`);
    }

    return true;
  } catch (err) {
    console.error(`Migration: error adding columns to table ${table}:`, err.message);
    return false;
  }
}

// Run database setup and migrations
const initializeDatabase = async () => {
  try {
    const setupSuccess = await setupDatabase();
    if (!setupSuccess) {
      console.error('Database setup failed');
      return;
    }

    await ensureColumns('cases', [
      ['account_id', 'INTEGER REFERENCES accounts(id) ON DELETE SET NULL'],
      ['contact_id', 'INTEGER REFERENCES contacts(id) ON DELETE SET NULL'],
      ['subject', 'TEXT'],
      ['priority', "TEXT DEFAULT 'Medium'"],
      ['status', "TEXT DEFAULT 'New'"],
    ]);

    await ensureColumns('tasks', [
      ['due_date', 'TEXT'],
      ['status', "TEXT DEFAULT 'Not Started'"],
      ['priority', "TEXT DEFAULT 'Medium'"],
      ['deal_id', 'INTEGER REFERENCES deals(id) ON DELETE SET NULL'],
      ['contact_id', 'INTEGER REFERENCES contacts(id) ON DELETE SET NULL']
    ]);

    await ensureColumns('quote_items', [
      ['product_name', 'TEXT NOT NULL DEFAULT ""']
    ]);

    // Create default admin user
    const adminExists = await getQuery('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin']);
    if (adminExists[0].count === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await runQuery('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
        ['admin', hashedPassword, 'Admin']);
      console.log('Default admin user created (admin/admin)');
    }

    console.log('Database setup completed successfully');
  } catch (err) {
    console.error('Database setup error:', err);
  }
};

initializeDatabase();

module.exports = {
  db,
  getQuery,
  runQuery,
  initializeDatabase,
  checkpointNow
};
