const express = require('express');
const categoryController = require('../../../../controllers/admin/categoryController');
const isAdmin = require('../../../../middlewares/isAdmin');
const upload = require('../../../../multer');
const router = express.Router();

// Add this at the beginning of your file, before you define any routes
/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the category
 *         name:
 *           type: string
 *           description: Name of the category
 *           example: Shoes
 *         slug:
 *           type: string
 *           description: URL-friendly version of the category name
 *           example: shoes
 *         title:
 *           type: string
 *           description: SEO-friendly title for the category
 *           example: Shop Quality Shoes Online
 *         description:
 *           type: string
 *           description: Detailed description of the category
 *           example: Browse our collection of quality footwear
 *         image:
 *           type: string
 *           description: URL or path to the category image
 *           example: uploads/categories/shoes.jpg
 *         isActive:
 *           type: boolean
 *           description: Whether the category is currently active
 *           default: true
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the admin who created/updated the category
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the category was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the category was last updated
 */

/**
 * @swagger
 * /admin/categories:
 *   post:
 *     summary: Create a new category
 *     description: Create a new product category (Admin only)
 *     tags: [Admin - Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *                 example: "Shoes"
 *               title:
 *                 type: string
 *                 description: SEO title for the category
 *                 example: "Shop Quality Shoes Online"
 *               description:
 *                 type: string
 *                 description: Detailed category description
 *                 example: "Browse our collection of quality footwear"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image file (jpg, jpeg, png, gif)
 *     responses:
 *       201:
 *         description: Category created successfully
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
 *                   example: "Category created successfully"
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid input or validation error
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Not an admin
 */
router.post('/', isAdmin, upload.single('image'), categoryController.createCategory);

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: Get all categories (admin view)
 *     description: Retrieve all categories with pagination including inactive ones (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of categories per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by (createdAt, name, etc.)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort direction (ascending or descending)
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                   example: "Categories retrieved successfully"
 *                 totalItems:
 *                   type: integer
 *                   example: 30
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 */
router.get('/', isAdmin, categoryController.adminGetAllCategories);

/**
 * @swagger
 * /admin/categories/slug/{slug}:
 *   get:
 *     summary: Get category by slug (admin view)
 *     description: Retrieve a specific category by its slug including inactive ones (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *         example: shoes
 *     responses:
 *       200:
 *         description: Category retrieved successfully
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
 *                   example: "Category retrieved successfully"
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */
router.get('/slug/:slug', isAdmin, categoryController.adminGetCategoryBySlug);

/**
 * @swagger
 * /admin/categories/filter:
 *   get:
 *     summary: Filter categories (admin view)
 *     description: Search and filter categories by name and/or active status (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by category name (partial match)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true/false)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of categories per page
 *     responses:
 *       200:
 *         description: Categories filtered successfully
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
 *                   example: "Categories filtered successfully"
 *                 totalItems:
 *                   type: integer
 *                   example: 5
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 */
router.get('/filter', isAdmin, categoryController.adminFilterCategories);

/**
 * @swagger
 * /admin/categories/{id}:
 *   put:
 *     summary: Update a category
 *     description: Update an existing category's details (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Running Shoes"
 *               title:
 *                 type: string
 *                 example: "Premium Running Shoes Collection"
 *               description:
 *                 type: string
 *                 example: "High-performance running shoes for all terrains"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image file (jpg, jpeg, png, gif)
 *     responses:
 *       200:
 *         description: Category updated successfully
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
 *                   example: "Category updated successfully"
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid input or validation error
 *       404:
 *         description: Category not found
 */
router.put('/:id', isAdmin, upload.single('image'), categoryController.updateCategory);

/**
 * @swagger
 * /admin/categories/{id}/status:
 *   patch:
 *     summary: Toggle category status
 *     description: Activate or deactivate a category (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
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
 *         description: Category status updated successfully
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
 *                   example: "Category deactivated successfully"
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid input or validation error
 *       404:
 *         description: Category not found
 */
router.patch('/:id/status', isAdmin, categoryController.toggleStatusCategory);

/**
 * @swagger
 * /admin/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     description: Permanently remove a category (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID to delete
 *     responses:
 *       200:
 *         description: Category deleted successfully
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
 *                   example: "Category deleted successfully"
 *       404:
 *         description: Category not found
 */
router.delete('/:id', isAdmin, categoryController.deleteCategory);

module.exports = router;
