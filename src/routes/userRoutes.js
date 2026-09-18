const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: ดึงรายการ Users ทั้งหมด
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: รายการ Users ทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Database error
 */
router.get('/', userController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: ดึง User ตาม ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ User
 *     responses:
 *       200:
 *         description: ข้อมูล User
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Database error
 */
router.get('/:id', userController.getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: สร้าง User ใหม่
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 description: ชื่อของ User
 *               email:
 *                 type: string
 *                 description: อีเมลของ User
 *     responses:
 *       201:
 *         description: สร้าง User สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: name and email are required
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Database error
 */
router.post('/', userController.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: ลบ User ตาม ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ User ที่ต้องการลบ
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 *       500:
 *         description: Database error
 */
router.delete('/:id', userController.deleteUser);

module.exports = router;
