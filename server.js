const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./src/config/database');
const accountRoutes = require('./src/routes/accountRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const productRoutes = require('./src/routes/productRoutes');
const opportunityRoutes = require('./src/routes/opportunityRoutes');
const dealRoutes = require('./src/routes/dealRoutes');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Swagger / API Docs
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRM API',
      version: '1.0.0',
      description: 'API สำหรับจัดการ Accounts, Contacts, Products และ Deals',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local Development Server',
      },
    ],
    components: {
      schemas: {
        Account: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID ของ Account',
            },
            name: {
              type: 'string',
              description: 'ชื่อของ Account',
            },
            industry: {
              type: 'string',
              description: 'อุตสาหกรรมของ Account',
            },
            phone: {
              type: 'string',
              description: 'เบอร์โทรศัพท์ของ Account',
            },
            website: {
              type: 'string',
              description: 'เว็บไซต์ของ Account',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'วันที่สร้าง Account',
            },
          },
        },
        Contact: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID ของ Contact',
            },
            account_id: {
              type: 'integer',
              description: 'ID ของ Account ที่เกี่ยวข้อง',
            },
            first_name: {
              type: 'string',
              description: 'ชื่อของ Contact',
            },
            last_name: {
              type: 'string',
              description: 'นามสกุลของ Contact',
            },
            email: {
              type: 'string',
              description: 'อีเมลของ Contact',
            },
            phone: {
              type: 'string',
              description: 'เบอร์โทรศัพท์ของ Contact',
            },
            title: {
              type: 'string',
              description: 'ตำแหน่งของ Contact',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'วันที่สร้าง Contact',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID ของ Product',
            },
            name: {
              type: 'string',
              description: 'ชื่อของ Product',
            },
            code: {
              type: 'string',
              description: 'รหัสสินค้า',
            },
            price: {
              type: 'number',
              description: 'ราคาของ Product',
            },
            description: {
              type: 'string',
              description: 'รายละเอียดของ Product',
            },
            is_active: {
              type: 'boolean',
              description: 'สถานะการใช้งานของ Product',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'วันที่สร้าง Product',
            },
          },
        },
        Deal: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID ของ Deal',
            },
            title: {
              type: 'string',
              description: 'ชื่อของ Deal',
            },
            amount: {
              type: 'number',
              description: 'จำนวนเงินของ Deal',
            },
            stage: {
              type: 'string',
              description: 'สถานะของ Deal',
              enum: ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'],
            },
            account_id: {
              type: 'integer',
              description: 'ID ของ Account ที่เกี่ยวข้อง',
            },
            contact_id: {
              type: 'integer',
              description: 'ID ของ Contact ที่เกี่ยวข้อง',
            },
            close_date: {
              type: 'string',
              format: 'date-time',
              description: 'วันที่คาดว่าจะปิด',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'วันที่สร้าง Deal',
            },
          },
        },
        Opportunity: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID ของ Opportunity',
            },
            account_id: {
              type: 'integer',
              description: 'ID ของ Account ที่เกี่ยวข้อง',
            },
            name: {
              type: 'string',
              description: 'ชื่อของ Opportunity',
            },
            amount: {
              type: 'number',
              description: 'จำนวนเงินของ Opportunity',
            },
            stage: {
              type: 'string',
              description: 'สถานะของ Opportunity',
              enum: ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'],
            },
            close_date: {
              type: 'string',
              format: 'date-time',
              description: 'วันที่คาดว่าจะปิด',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'วันที่สร้าง Opportunity',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/routes/**/*.js', './server.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hey, welcome to the API!' });
});

// Users routes
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY id DESC', [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

app.get('/api/users/:id', (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function (err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: this.lastID, name, email });
  });
});

app.delete('/api/users/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  });
});

// Accounts routes
app.use('/api/accounts', accountRoutes);

// Contacts routes
app.use('/api/contacts', contactRoutes);

// Products routes
app.use('/api/products', productRoutes);

// Opportunities routes
app.use('/api/opportunities', opportunityRoutes);

// Deals routes
app.use('/api/deals', dealRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Create deals table if not exists, then start server
db.run(`
  CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL,
    stage TEXT CHECK (stage IN ('Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost')),
    account_id INTEGER,
    contact_id INTEGER,
    close_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
  );
`, (err) => {
  if (err) {
    console.error('Error creating deals table:', err.message);
  } else {
    console.log('Deals table ready');
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
  });
});
