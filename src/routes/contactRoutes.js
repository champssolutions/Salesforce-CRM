const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: ดึงรายการ Contacts ทั้งหมด
 *     tags: [Contacts]
 *     responses:
 *       200:
 *         description: รายการ Contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Contact'
 *       500:
 *         description: Database error
 */
router.get('/', contactController.getAllContacts);

/**
 * @swagger
 * /api/contacts/{id}:
 *   get:
 *     summary: ดึง Contact ตาม ID
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Contact
 *     responses:
 *       200:
 *         description: ข้อมูล Contact
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Database error
 */
router.get('/:id', contactController.getContactById);

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: สร้าง Contact ใหม่
 *     tags: [Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_id
 *               - first_name
 *             properties:
 *               account_id:
 *                 type: integer
 *                 example: 1
 *               first_name:
 *                 type: string
 *                 example: สมชาย
 *               last_name:
 *                 type: string
 *                 example: ใจดี
 *               email:
 *                 type: string
 *                 example: somchai@example.com
 *               phone:
 *                 type: string
 *                 example: 089-123-4567
 *     responses:
 *       201:
 *         description: สร้าง Contact สำเร็จ
 *       400:
 *         description: account_id and first_name are required
 *       404:
 *         description: Account not found
 *       500:
 *         description: Database error
 */
router.post('/', contactController.createContact);

/**
 * @swagger
 * /api/contacts/{id}:
 *   put:
 *     summary: แก้ไข Contact ทั้งหมด
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Contact
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *             properties:
 *               account_id:
 *                 type: integer
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: แก้ไข Contact สำเร็จ
 *       400:
 *         description: first_name is required
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Database error
 */
router.put('/:id', contactController.updateContact);

/**
 * @swagger
 * /api/contacts/{id}:
 *   delete:
 *     summary: ลบ Contact
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Contact
 *     responses:
 *       200:
 *         description: ลบ Contact สำเร็จ
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Database error
 */
router.delete('/:id', contactController.deleteContact);

module.exports = router;
