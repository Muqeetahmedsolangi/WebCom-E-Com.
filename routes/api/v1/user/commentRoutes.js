const express = require('express');
const isUser = require('../../../../middlewares/isUser');
const commentController = require('../../../../controllers/user/commentController');

const router = express.Router();

/**
 * @swagger
 * /user/comments:
 *   post:
 *     summary: Create a new comment
 *     description: Add a new comment to a product (requires authentication)
 *     tags: [User - Comments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - content
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the product to comment on
 *               content:
 *                 type: string
 *                 description: Comment content
 *     responses:
 *       201:
 *         description: Comment created successfully (pending approval)
 *       400:
 *         description: Bad request - Invalid input
 *       404:
 *         description: Product not found
 */
router.post('/', isUser, commentController.createComment);

/**
 * @swagger
 * /user/comments/reply:
 *   post:
 *     summary: Reply to a comment
 *     description: Create a reply to an existing comment (requires authentication)
 *     tags: [User - Comments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parentId
 *               - content
 *             properties:
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the parent comment to reply to
 *               content:
 *                 type: string
 *                 description: Reply content
 *     responses:
 *       201:
 *         description: Reply created successfully (pending approval)
 *       400:
 *         description: Bad request - Invalid input or nested reply
 *       404:
 *         description: Parent comment not found
 */
router.post('/reply', isUser, commentController.replyToComment);

/**
 * @swagger
 * /user/comments/me:
 *   get:
 *     summary: Get current user's comments
 *     description: Retrieve all comments posted by the current user
 *     tags: [User - Comments]
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
 *         description: Number of comments per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
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
 *         description: Comments retrieved successfully
 */
router.get('/me', isUser, commentController.getMyComments);

/**
 * @swagger
 * /user/comments/product/{productId}:
 *   get:
 *     summary: Get product comments
 *     description: Retrieve all approved comments for a specific product
 *     tags: [User - Comments]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
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
 *         description: Number of comments per page
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         description: Product not found or inactive
 */
router.get('/product/:productId', commentController.getProductComments);

/**
 * @swagger
 * /user/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     description: Delete an existing comment (user can only delete their own comments)
 *     tags: [User - Comments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Forbidden - Not your comment
 *       404:
 *         description: Comment not found
 */
router.delete('/:id', isUser, commentController.deleteComment);

module.exports = router;
