const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

/**
 * Middleware ตรวจสอบ JWT Bearer Token
 * - ถ้าไม่มี token หรือ token ไม่ผ่านการ verify จะตอบ 401
 * - ถ้าผ่าน จะแนบ req.user ไว้ให้ controller ใช้ (id, username, role)
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization format' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware ตรวจสอบ role — ใช้กับ route ที่ต้องจำกัดเฉพาะ role บางอย่าง
 * ตัวอย่าง: authorize(['Admin'])
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
