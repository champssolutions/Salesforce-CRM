const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// กำหนด Routes สำหรับ Tasks
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// ส่งออก router เพื่อให้ server.js นำไปใช้งานได้ (บรรทัดนี้คือตัวแก้ Error)
module.exports = router;

const db = require('../config/database'); // (หรือ path ที่คุณใช้เรียก database)

// 1. วาง Helper Function ไว้ด้านบนสุด (ใต้ส่วน require)
function normalizeFk(val) {
    if (val === null || val === undefined || val === '' || val === 'null' || val === 'undefined') {
        return null;
    }
    const num = Number(val);
    return isNaN(num) ? null : num;
}

// 2. ค้นหาและแก้ไขฟังก์ชัน createTask
exports.createTask = (req, res) => {
    const { title, description, due_date, status, priority, deal_id, contact_id } = req.body;
    
    // >>> นำตัวแปร Foreign Key มาเข้าฟังก์ชัน normalizeFk ก่อน <<<
    const dealId = normalizeFk(deal_id);
    const contactId = normalizeFk(contact_id);

    const sql = `INSERT INTO tasks (title, description, due_date, status, priority, deal_id, contact_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    // >>> ใช้ตัวแปร dealId และ contactId ที่ผ่านการแปลงค่าแล้วใน params <<<
    const params = [title, description, due_date, status, priority, dealId, contactId];

    db.run(sql, params, function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
};

// ... โค้ดฟังก์ชันอื่นๆ (getAllTasks, getTaskById, updateTask, deleteTask) คงไว้เหมือนเดิม ...const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// GET /api/tasks - Get all tasks
router.get('/', taskController.getAllTasks);

// GET /api/tasks/:id - Get single task by ID
router.get('/:id', taskController.getTaskById);

// POST /api/tasks - Create new task
router.post('/', taskController.createTask);

// PUT /api/tasks/:id - Update task
router.put('/:id', taskController.updateTask);

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
