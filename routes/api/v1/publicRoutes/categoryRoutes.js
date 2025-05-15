const express = require('express');
const CategoryController = require('../../../../controllers/publicwork/categoryController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Public - Categories
 *   description: Category operations accessible to all users without authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PublicCategory:
 *       type: object
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
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all active categories
 *     description: Retrieve all active categories with pagination
 *     tags: [Public - Categories]
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
 *           default: name
 *         description: Field to sort by (name, createdAt, etc.)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
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
 *                     $ref: '#/components/schemas/PublicCategory'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 */
router.get('/', CategoryController.getAllCategories);

/**
 * @swagger
 * /categories/search:
 *   get:
 *     summary: Search categories
 *     description: Search and filter active categories by name
 *     tags: [Public - Categories]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by category name (partial match)
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
 *                     $ref: '#/components/schemas/PublicCategory'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 */
router.get('/search', CategoryController.filterCategories);

/**
 * @swagger
 * /categories/{slug}:
 *   get:
 *     summary: Get category by slug
 *     description: Retrieve a specific active category by its slug
 *     tags: [Public - Categories]
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
 *                   $ref: '#/components/schemas/PublicCategory'
 *       404:
 *         description: Category not found
 */
router.get('/:slug', CategoryController.getCategoryBySlug);

module.exports = router;
