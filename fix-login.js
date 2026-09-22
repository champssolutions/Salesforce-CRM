const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./data/app.db');

// สร้างรหัสผ่าน 'admin'
bcrypt.hash('admin', 10, (err, hash) => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        username TEXT UNIQUE, 
        password TEXT, 
        role TEXT
    )`, () => {
        // เพิ่มหรืออัปเดตบัญชี admin
        db.run("INSERT OR REPLACE INTO users (id, username, password, role) VALUES (1, 'admin', ?, 'admin')", [hash], (insertErr) => {
            if (insertErr) {
                console.error("Error:", insertErr.message);
            } else {
                console.log("✅ Admin account created/updated! Username: admin, Password: admin");
            }
            db.close();
        });
    });
});