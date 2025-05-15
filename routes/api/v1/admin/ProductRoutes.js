const express = require('express');
const isAdmin = require('../../../../middlewares/isAdmin');
const ProductController = require('../../../../controllers/admin/productController');
const upload = require('../../../../multer');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - categoryId
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the product
 *         name:
 *           type: string
 *           description: Name of the product
 *           example: Premium Smartphone X20
 *         slug:
 *           type: string
 *           description: URL-friendly version of the product name
 *           example: premium-smartphone-x20
 *         title:
 *           type: string
 *           description: SEO-friendly title for the product
 *           example: Premium Smartphone X20 with Advanced Features
 *         description:
 *           type: string
 *           description: Detailed description of the product
 *           example: This premium smartphone features a high-resolution display, powerful processor, and long-lasting battery.
 *         shortDescription:
 *           type: string
 *           description: Brief summary of the product
 *           example: High-end smartphone with advanced features
 *         price:
 *           type: number
 *           format: float
 *           description: Regular price of the product
 *           example: 799.99
 *         discountPrice:
 *           type: number
 *           format: float
 *           description: Discounted price of the product (if applicable)
 *           example: 699.99
 *         quantity:
 *           type: integer
 *           description: Available stock quantity
 *           example: 100
 *         images:
 *           type: array
 *           description: Array of image paths for the product (max 10)
 *           items:
 *             type: string
 *           example: ["products/1623456789-a1b2c3-smartphone-x20-front.jpg", "products/1623456790-d4e5f6-smartphone-x20-back.jpg"]
 *         featured:
 *           type: boolean
 *           description: Whether the product is featured on the homepage
 *           default: false
 *         isActive:
 *           type: boolean
 *           description: Whether the product is currently active and visible to customers
 *           default: true
 *         avgRating:
 *           type: number
 *           format: float
 *           description: Average customer rating (0-5)
 *           example: 4.5
 *         reviewCount:
 *           type: integer
 *           description: Number of customer reviews
 *           example: 28
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: ID of the category this product belongs to
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the admin who created/updated the product
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the product was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the product was last updated
 */

/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product with multiple image uploads (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: "Premium Smartphone X20"
 *               title:
 *                 type: string
 *                 description: SEO title for the product
 *                 example: "Premium Smartphone X20 with Advanced Features"
 *               description:
 *                 type: string
 *                 description: Detailed product description
 *                 example: "This premium smartphone features a high-resolution display, powerful processor, and long-lasting battery."
 *               shortDescription:
 *                 type: string
 *                 description: Brief product summary (for listings)
 *                 example: "High-end smartphone with advanced features"
 *               price:
 *                 type: number
 *                 description: Regular product price
 *                 example: 799.99
 *               discountPrice:
 *                 type: number
 *                 description: Discounted price (if applicable)
 *                 example: 699.99
 *               quantity:
 *                 type: integer
 *                 description: Available stock quantity
 *                 example: 100
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID this product belongs to
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product images (max 10 files, jpg, jpeg, png, gif)
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Product created successfully"
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input or validation error
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: Category not found
 */
router.post('/', isAdmin, upload.array('images'), ProductController.createProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   put:
 *     summary: Update a product
 *     description: Update an existing product's details including images (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: "Premium Smartphone X20 Pro"
 *               title:
 *                 type: string
 *                 description: SEO title for the product
 *                 example: "Premium Smartphone X20 Pro with Enhanced Features"
 *               description:
 *                 type: string
 *                 description: Detailed product description
 *                 example: "This premium smartphone features a high-resolution AMOLED display, powerful octa-core processor, and extra-long battery life."
 *               shortDescription:
 *                 type: string
 *                 description: Brief product summary (for listings)
 *                 example: "Upgraded high-end smartphone with premium features"
 *               price:
 *                 type: number
 *                 description: Regular product price
 *                 example: 899.99
 *               discountPrice:
 *                 type: number
 *                 description: Discounted price (if applicable)
 *                 example: 799.99
 *               quantity:
 *                 type: integer
 *                 description: Available stock quantity
 *                 example: 75
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID this product belongs to
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               featured:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 description: Whether the product should be featured (converted to boolean)
 *                 example: "true"
 *               removeImages:
 *                 type: array
 *                 description: Indices of existing images to remove (0-based)
 *                 items:
 *                   type: integer
 *                 example: [0, 2]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New product images to add (max 10 total, jpg, jpeg, png, gif)
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Product updated successfully"
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input or validation error
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: Product or category not found
 */
router.put('/:id', isAdmin, upload.array('images'), ProductController.updateProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   patch:
 *     summary: Partially update a product
 *     description: Update specific fields of an existing product (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *                 description: Product price
 *                 example: 849.99
 *               discountPrice:
 *                 type: number
 *                 description: Discounted price
 *                 example: 749.99
 *               quantity:
 *                 type: integer
 *                 description: Available stock
 *                 example: 50
 *               featured:
 *                 type: boolean
 *                 description: Featured product status
 *                 example: true
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Product updated successfully"
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input or validation error
 *       404:
 *         description: Product not found
 */
router.patch('/:id', isAdmin, ProductController.updateProduct);

/**
 * @swagger
 * /admin/products/{id}/status:
 *   patch:
 *     summary: Toggle product status
 *     description: Activate or deactivate a product (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: boolean
 *                 description: Status to set (true=active, false=inactive)
 *                 example: false
 *     responses:
 *       200:
 *         description: Product status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Product deactivated successfully"
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input or validation error
 *       404:
 *         description: Product not found
 */
router.patch('/:id/status', isAdmin, ProductController.toggleProductStatus);

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Permanently remove a product and its associated images (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID to delete
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Product deleted successfully"
 *       404:
 *         description: Product not found
 */
router.delete('/:id', isAdmin, ProductController.deleteProduct);

module.exports = router;
