const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');

/**
 * @swagger
 * /api/deals:
 *   get:
 *     summary: ดึงรายการ Deals ทั้งหมด
 *     tags: [Deals]
 *     responses:
 *       200:
 *         description: รายการ Deals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Deal'
 *       500:
 *         description: Database error
 */
router.get('/', dealController.getAllDeals);

/**
 * @swagger
 * /api/deals/{id}:
 *   get:
 *     summary: ดึง Deal ตาม ID
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Deal
 *     responses:
 *       200:
 *         description: ข้อมูล Deal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deal'
 *       404:
 *         description: Deal not found
 *       500:
 *         description: Database error
 */
router.get('/:id', dealController.getDealById);

/**
 * @swagger
 * /api/deals/account/{accountId}:
 *   get:
 *     summary: ดึง Deals ตาม Account ID
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Account
 *     responses:
 *       200:
 *         description: รายการ Deals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Deal'
 *       404:
 *         description: Account not found
 *       500:
 *         description: Database error
 */
router.get('/account/:accountId', dealController.getDealsByAccountId);

/**
 * @swagger
 * /api/deals:
 *   post:
 *     summary: สร้าง Deal ใหม่
 *     tags: [Deals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - amount
 *               - stage
 *             properties:
 *               title:
 *                 type: string
 *                 example: โอกาสทางการขาย A
 *               amount:
 *                 type: number
 *                 example: 100000
 *               stage:
 *                 type: string
 *                 enum: ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost']
 *                 example: Prospecting
 *               account_id:
 *                 type: integer
 *                 example: 1
 *               contact_id:
 *                 type: integer
 *                 example: 1
 *               close_date:
 *                 type: string
 *                 format: date-time
 *                 example: 2023-10-01T00:00:00Z
 *     responses:
 *       201:
 *         description: สร้าง Deal สำเร็จ
 *       400:
 *         description: title, amount, and stage are required
 *       404:
 *         description: Account or Contact not found
 *       500:
 *         description: Database error
 */
router.post('/', dealController.createDeal);

/**
 * @swagger
 * /api/deals/{id}:
 *   put:
 *     summary: แก้ไข Deal ทั้งหมด
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Deal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - amount
 *               - stage
 *             properties:
 *               title:
 *                 type: string
 *               amount:
 *                 type: number
 *               stage:
 *                 type: string
 *                 enum: ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost']
 *               account_id:
 *                 type: integer
 *               contact_id:
 *                 type: integer
 *               close_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: แก้ไข Deal สำเร็จ
 *       400:
 *         description: title, amount, and stage are required
 *       404:
 *         description: Deal, Account, or Contact not found
 *       500:
 *         description: Database error
 */
router.put('/:id', dealController.updateDeal);

/**
 * @swagger
 * /api/deals/{id}:
 *   patch:
 *     summary: แก้ไข Deal บางส่วน
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Deal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               amount:
 *                 type: number
 *               stage:
 *                 type: string
 *                 enum: ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost']
 *               account_id:
 *                 type: integer
 *               contact_id:
 *                 type: integer
 *               close_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: แก้ไข Deal สำเร็จ
 *       400:
 *         description: At least one field must be provided
 *       404:
 *         description: Deal, Account, or Contact not found
 *       500:
 *         description: Database error
 */
router.patch('/:id', dealController.patchDeal);

/**
 * @swagger
 * /api/deals/{id}:
 *   delete:
 *     summary: ลบ Deal
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Deal
 *     responses:
 *       200:
 *         description: ลบ Deal สำเร็จ
 *       404:
 *         description: Deal not found
 *       500:
 *         description: Database error
 */
router.delete('/:id', dealController.deleteDeal);

module.exports = router;
