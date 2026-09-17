const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: ดึงรายการ Products ทั้งหมด
 *     tags: [Products]
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
 *         description: รายการ Products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Database error
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: ดึง Product ตาม ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Product
 *     responses:
 *       200:
 *         description: ข้อมูล Product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       500:
 *         description: Database error
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: สร้าง Product ใหม่
 *     tags: [Products]
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
 *                 example: สินค้า A
 *               description:
 *                 type: string
 *                 example: รายละเอียดสินค้า
 *               price:
 *                 type: number
 *                 example: 999.99
 *     responses:
 *       201:
 *         description: สร้าง Product สำเร็จ
 *       400:
 *         description: name is required
 *       500:
 *         description: Database error
 */
router.post('/', productController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: แก้ไข Product ทั้งหมด
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Product
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
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: แก้ไข Product สำเร็จ
 *       400:
 *         description: name is required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Database error
 */
router.put('/:id', productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: แก้ไข Product บางส่วน
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: แก้ไข Product สำเร็จ
 *       400:
 *         description: At least one field must be provided
 *       404:
 *         description: Product not found
 *       500:
 *         description: Database error
 */
router.patch('/:id', productController.patchProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: ลบ Product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ Product
 *     responses:
 *       200:
 *         description: ลบ Product สำเร็จ
 *       404:
 *         description: Product not found
 *       500:
 *         description: Database error
 */
router.delete('/:id', productController.deleteProduct);

module.exports = router;
