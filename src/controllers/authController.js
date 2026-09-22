const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.login = (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid username' });

        // เทียบรหัสผ่านที่รับมา กับรหัสผ่านที่เข้ารหัสไว้ใน Database
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

        // สร้าง Token (แก้ไข 'your_jwt_secret' ให้ตรงกับที่โปรเจกต์คุณตั้งไว้ถ้ามี)
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role }, 
            'your_jwt_secret', 
            { expiresIn: '24h' }
        );

        res.json({ 
            message: 'Login successful', 
            token, 
            user: { id: user.id, username: user.username, role: user.role } 
        });
    });
};