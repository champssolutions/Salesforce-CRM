const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const contactController = require('../controllers/contactController');

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: ดึงรายการ Accounts ทั้งหมด
 *     tags: [Accounts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: หมายเลขหน้า
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: จำนวนรายการต่อหน้า (สูงสุด 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: คำค้นหา
 *     responses:
 *       200:
 *         description: รายการ Accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Account'
 *       500:
 *         description: Database error
 */
router.get('/', accountController.getAllAccounts);

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: ดึง Account ตาม ID
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Account
 *     responses:
 *       200:
 *         description: ข้อมูล Account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       404:
 *         description: Account not found
 *       500:
 *         description: Database error
 */
router.get('/:id', accountController.getAccountById);

/**
 * @swagger
 * /api/accounts/{id}/contacts:
 *   get:
 *     summary: ดึง Contacts ของ Account
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Account
 *     responses:
 *       200:
 *         description: รายการ Contacts ของ Account
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Contact'
 *       404:
 *         description: Account not found
 *       500:
 *         description: Database error
 */
router.get('/:id/contacts', contactController.getContactsByAccountId);

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: สร้าง Account ใหม่
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: บริษัท ABC จำกัด
 *               industry:
 *                 type: string
 *                 example: เทคโนโลยี
 *               phone:
 *                 type: string
 *                 example: 02-123-4567
 *               website:
 *                 type: string
 *                 example: https://abc.com
 *     responses:
 *       201:
 *         description: สร้าง Account สำเร็จ
 *       400:
 *         description: name is required
 *       500:
 *         description: Database error
 */
router.post('/', accountController.createAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   put:
 *     summary: แก้ไข Account ทั้งหมด
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               industry:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *     responses:
 *       200:
 *         description: แก้ไข Account สำเร็จ
 *       400:
 *         description: name is required
 *       404:
 *         description: Account not found
 *       500:
 *         description: Database error
 */
router.put('/:id', accountController.updateAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   patch:
 *     summary: แก้ไข Account บางส่วน
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               industry:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *     responses:
 *       200:
 *         description: แก้ไข Account สำเร็จ
 *       400:
 *         description: At least one field must be provided
 *       404:
 *         description: Account not found
 *       500:
 *         description: Database error
 */
router.patch('/:id', accountController.patchAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: ลบ Account
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Account
 *     responses:
 *       200:
 *         description: ลบ Account สำเร็จ
 *       404:
 *         description: Account not found
 *       500:
 *         description: Database error
 */
router.delete('/:id', accountController.deleteAccount);

module.exports = router;
