const express = require('express');
const path = require('path');
const cors = require('cors');
const { initializeDatabase, checkpointNow } = require('./src/config/database');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const accountRoutes = require('./src/routes/accountRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const productRoutes = require('./src/routes/productRoutes');
const opportunityRoutes = require('./src/routes/opportunityRoutes');
const dealRoutes = require('./src/routes/dealRoutes');
const leadRoutes = require('./src/routes/leadRoutes');
const caseRoutes = require('./src/routes/caseRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const quoteRoutes = require('./src/routes/quoteRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes'); // เพิ่มบรรทัดนี้สำหรับ Dashboard

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 4000;
// When PORT is explicitly 0 (e.g. in some environments), force local dev port.
if (PORT === 0) {
  process.env.PORT = 4000;
}
if (typeof PORT !== 'number') {
  process.env.PORT = 4000;
}

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

// Static files (รับผิดชอบส่ง index.html จากโฟลเดอร์ public)
app.use(express.static(path.join(__dirname, 'public')));

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Hey, welcome to the API!' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/products', productRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/analytics', analyticsRoutes); // เพิ่มใช้งาน Analytics Route

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
            id: { type: 'integer', description: 'ID ของ Account' },
            name: { type: 'string', description: 'ชื่อของ Account' },
            industry: { type: 'string', description: 'อุตสาหกรรมของ Account' },
            phone: { type: 'string', description: 'เบอร์โทรศัพท์ของ Account' },
            website: { type: 'string', description: 'เว็บไซต์ของ Account' },
            created_at: { type: 'string', format: 'date-time', description: 'วันที่สร้าง Account' },
          },
        },
        Contact: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID ของ Contact' },
            account_id: { type: 'integer', description: 'ID ของ Account ที่เกี่ยวข้อง' },
            first_name: { type: 'string', description: 'ชื่อของ Contact' },
            last_name: { type: 'string', description: 'นามสกุลของ Contact' },
            email: { type: 'string', description: 'อีเมลของ Contact' },
            phone: { type: 'string', description: 'เบอร์โทรศัพท์ของ Contact' },
            title: { type: 'string', description: 'ตำแหน่งของ Contact' },
            created_at: { type: 'string', format: 'date-time', description: 'วันที่สร้าง Contact' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID ของ Product' },
            name: { type: 'string', description: 'ชื่อของ Product' },
            code: { type: 'string', description: 'รหัสสินค้า' },
            price: { type: 'number', description: 'ราคาของ Product' },
            description: { type: 'string', description: 'รายละเอียดของ Product' },
            is_active: { type: 'boolean', description: 'สถานะการใช้งานของ Product' },
            created_at: { type: 'string', format: 'date-time', description: 'วันที่สร้าง Product' },
          },
        },
        Deal: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID ของ Deal' },
            title: { type: 'string', description: 'ชื่อของ Deal' },
            amount: { type: 'number', description: 'จำนวนเงินของ Deal' },
            stage: { type: 'string', description: 'สถานะของ Deal', enum: ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'] },
            account_id: { type: 'integer', description: 'ID ของ Account ที่เกี่ยวข้อง' },
            contact_id: { type: 'integer', description: 'ID ของ Contact ที่เกี่ยวข้อง' },
            close_date: { type: 'string', format: 'date-time', description: 'วันที่คาดว่าจะปิด' },
            created_at: { type: 'string', format: 'date-time', description: 'วันที่สร้าง Deal' },
          },
        },
        Opportunity: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID ของ Opportunity' },
            account_id: { type: 'integer', description: 'ID ของ Account ที่เกี่ยวข้อง' },
            name: { type: 'string', description: 'ชื่อของ Opportunity' },
            amount: { type: 'number', description: 'จำนวนเงินของ Opportunity' },
            stage: { type: 'string', description: 'สถานะของ Opportunity', enum: ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'] },
            close_date: { type: 'string', format: 'date-time', description: 'วันที่คาดว่าจะปิด' },
            created_at: { type: 'string', format: 'date-time', description: 'วันที่สร้าง Opportunity' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID ของ User' },
            name: { type: 'string', description: 'ชื่อของ User' },
            email: { type: 'string', description: 'อีเมลของ User' },
            created_at: { type: 'string', format: 'date-time', description: 'วันที่สร้าง User' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/routes/**/*.js', './server.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
  console.log('Tip: use /api/auth/login with admin / admin to get a token');
try {
  checkpointNow();
  console.log('WAL checkpoint issued after startup');
} catch (e) { console.warn('checkpoint failed', e); }
});