const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Create tables in proper dependency order
// Run all database setup in sequence
const setupDatabase = async () => {
  try {
    db.run('PRAGMA journal_mode = WAL', (err) => {
      if (err) {
        console.error('Error setting journal mode:', err.message);
        return false;
      }
      
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error enabling foreign keys:', err.message);
          return false;
        }

        // Create tables in proper dependency order
        db.run(`CREATE TABLE IF NOT EXISTS accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          industry TEXT,
          phone TEXT,
          website TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );`, (err) => {
          if (err) return reject(err);
          resolve();
        });
      }),
      new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          price REAL,
          description TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        );`, (err) => {
          if (err) {
            console.error('Error creating products table:', err.message);
            return false;
          }

          db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'User',
            created_at TEXT DEFAULT (datetime('now'))
          );`, (err) => {
            if (err) {
              console.error('Error creating users table:', err.message);
              return false;
            }

            // Create remaining tables sequentially
            db.run(`CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT,
        company TEXT,
        status TEXT DEFAULT 'New',
        email TEXT,
        phone TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );`, (err) => {
        if (err) {
          console.error('Error creating leads table:', err.message);
          return false;
        }

        db.run(`CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
        first_name TEXT NOT NULL,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        title TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );`, (err) => {
        if (err) {
          console.error('Error creating contacts table:', err.message);
          return false;
        }

        db.run(`CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL,
        stage TEXT CHECK (stage IN ('Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost')),
        account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
        close_date TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );`, (err) => {
        if (err) {
          console.error('Error creating deals table:', err.message);
          return false;
        }

        db.run(`CREATE TABLE IF NOT EXISTS opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        amount REAL,
        stage TEXT CHECK (stage IN ('Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost')),
        close_date TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );`, (err) => {
        if (err) {
          console.error('Error creating opportunities table:', err.message);
          return false;
        }

        db.run(`CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote_number TEXT UNIQUE NOT NULL,
        deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
        total_amount REAL NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected')),
        expiration_date TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );`, (err) => {
        if (err) {
          console.error('Error creating quotes table:', err.message);
          return false;
        }

        db.run(`CREATE TABLE IF NOT EXISTS quote_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
        unit_price REAL NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
        total_price REAL NOT NULL DEFAULT 0 CHECK (total_price >= 0),
        created_at TEXT DEFAULT (datetime('now'))
      );`, (err) => {
        if (err) {
          console.error('Error creating quote_items table:', err.message);
          return false;
        }

        // Insert default admin user if users table is empty
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
          if (err) {
            console.error('Error checking user count:', err.message);
            return false;
          }

          if (row.count === 0) {
            db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
              ['admin', 'password', 'Admin'], (err) => {
                if (err) {
                  console.error('Error creating admin user:', err.message);
                  return false;
                }
                console.log('Default admin user created');
                return true;
            });
          }
          return true;
        });
      });
    });
  });
  return true;
} catch (err) {
  console.error('Error setting up database:', err);
  return false;
};

/**
 * เพิ่มคอลัมน์ที่ขาดหายให้ตารางที่มีอยู่แล้ว (idempotent)
 * ตรวจ PRAGMA table_info ก่อน จึงรันซ้ำได้โดยไม่ error
 * จำเป็นสำหรับฐานข้อมูลเดิมที่สร้างก่อนที่ schema จะเพิ่มคอลัมน์เหล่านี้
 */
/**
 * Safely adds columns to existing tables
 * @param {string} table - Table name
 * @param {Array<[string, string]>} columns - Array of [columnName, columnDefinition] pairs
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

    const results = await Promise.all(missing.map(([name, definition]) => 
      new Promise((resolve) => {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`, (err) => {
          if (err) {
            console.error(`Migration: failed to add ${table}.${name}:`, err.message);
            return resolve(false);
          }
          console.log(`Migration: added column ${table}.${name}`);
          resolve(true);
        });
      })
    ));

    if (results.some(r => r === false)) {
      console.error(`Migration: some columns failed to add to table ${table}`);
    }
    return results.every(Boolean);
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
      throw new Error('Database setup failed');
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

    console.log('Database setup completed successfully');
  } catch (err) {
    console.error('Database setup failed:', err);
    process.exit(1);
  }
};

initializeDatabase();

module.exports = db;
