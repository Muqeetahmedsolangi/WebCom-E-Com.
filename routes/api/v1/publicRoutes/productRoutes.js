const { Router } = require('express');

const ProductController = require('../../../../controllers/publicwork/productController');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Public - Products
 *   description: Product operations accessible to all users without authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PublicProduct:
 *       type: object
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
 *         shortDescription:
 *           type: string
 *           description: Brief summary of the product
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
 *         images:
 *           type: array
 *           description: Array of image paths for the product
 *           items:
 *             type: string
 *         avgRating:
 *           type: number
 *           format: float
 *           description: Average customer rating (0-5)
 *           example: 4.5
 *         reviewCount:
 *           type: integer
 *           description: Number of customer reviews
 *           example: 28
 *         category:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             slug:
 *               type: string
 */

/**
 * @swagger
 * /public/products:
 *   get:
 *     summary: Get all active products
 *     description: Retrieve a paginated list of all active products
 *     tags: [Public - Products]
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
 *           default: 12
 *         description: Number of products per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: "Products retrieved successfully"
 *                 totalItems:
 *                   type: integer
 *                   example: 50
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicProduct'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 */
router.get('/', ProductController.getProducts);

/**
 * @swagger
 * /public/products/featured:
 *   get:
 *     summary: Get featured products
 *     description: Retrieve a list of active products marked as featured
 *     tags: [Public - Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of featured products to return
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
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
 *                   example: "Featured products retrieved successfully"
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicProduct'
 */
router.get('/featured', ProductController.getFeaturedProducts);

/**
 * @swagger
 * /public/products/search:
 *   get:
 *     summary: Search products
 *     description: Search for products by name, description or category
 *     tags: [Public - Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query term
 *         required: true
 *         example: smartphone
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
 *           default: 12
 *         description: Number of products per page
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum product price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum product price filter
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
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
 *                   example: "Search results retrieved successfully"
 *                 query:
 *                   type: string
 *                   example: "smartphone"
 *                 totalItems:
 *                   type: integer
 *                   example: 12
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicProduct'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 2
 */
router.get('/search', ProductController.searchProducts);

/**
 * @swagger
 * /public/products/category/{categoryId}:
 *   get:
 *     summary: Get products by category ID
 *     description: Retrieve products belonging to a specific category
 *     tags: [Public - Products]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
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
 *           default: 12
 *         description: Number of products per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: "Products retrieved successfully"
 *                 category:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                       example: "Smartphones"
 *                     slug:
 *                       type: string
 *                       example: "smartphones"
 *                 totalItems:
 *                   type: integer
 *                   example: 25
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicProduct'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *       404:
 *         description: Category not found
 */
router.get('/category/:categoryId', ProductController.getProductsByCategory);

/**
 * @swagger
 * /public/products/category/slug/{slug}:
 *   get:
 *     summary: Get products by category slug
 *     description: Retrieve products belonging to a category with the specified slug
 *     tags: [Public - Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *         example: smartphones
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
 *           default: 12
 *         description: Number of products per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: "Products retrieved successfully"
 *                 category:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                       example: "Smartphones"
 *                     slug:
 *                       type: string
 *                       example: "smartphones"
 *                 totalItems:
 *                   type: integer
 *                   example: 25
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicProduct'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *       404:
 *         description: Category not found
 */
router.get('/category/slug/:slug', ProductController.getProductsByCategorySlug);

/**
 * @swagger
 * /public/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve detailed information about a specific product by its ID
 *     tags: [Public - Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
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
 *                   example: "Product retrieved successfully"
 *                 product:
 *                   $ref: '#/components/schemas/PublicProduct'
 *                 relatedProducts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicProduct'
 *       404:
 *         description: Product not found or inactive
 */
router.get('/:id', ProductController.getProductById);

/**
 * @swagger
 * /public/products/slug/{slug}:
 *   get:
 *     summary: Get product by slug
 *     description: Retrieve detailed information about a specific product by its slug (URL-friendly name)
 *     tags: [Public - Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product slug
 *         example: premium-smartphone-x20
 *     responses:
 *       200:
 *         description: Product retrieved successfully
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
 *                   example: "Product retrieved successfully"
 *                 product:
 *                   $ref: '#/components/schemas/PublicProduct'
 *                 relatedProducts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicProduct'
 *       404:
 *         description: Product not found or inactive
 */
router.get('/slug/:slug', ProductController.getProductBySlug);

module.exports = router;
