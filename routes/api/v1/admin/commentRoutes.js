const express = require('express');
const isAdmin = require('../../../../middlewares/isAdmin');
const commentController = require('../../../../controllers/admin/commentController');

const router = express.Router();

/**
 * @swagger
 * /admin/comments/pending:
 *   get:
 *     summary: Get pending comments
 *     description: Retrieve all comments waiting for admin approval
 *     tags: [Admin - Comments]
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
 *         description: Pending comments retrieved successfully
 */
router.get('/pending', isAdmin, commentController.getPendingComments);

/**
 * @swagger
 * /admin/comments/{id}/approve:
 *   patch:
 *     summary: Approve a comment
 *     description: Approve a pending comment (Admin only)
 *     tags: [Admin - Comments]
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
 *         description: Comment approved successfully
 *       404:
 *         description: Comment not found
 */
router.patch('/:id/approve', isAdmin, commentController.approveComment);

/**
 * @swagger
 * /admin/comments/{id}/reject:
 *   delete:
 *     summary: Reject a comment
 *     description: Reject and delete a pending comment (Admin only)
 *     tags: [Admin - Comments]
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
 *         description: Comment rejected and deleted successfully
 *       404:
 *         description: Comment not found
 */
router.delete('/:id/reject', isAdmin, commentController.rejectComment);

/**
 * @swagger
 * /admin/comments/{id}:
 *   delete:
 *     summary: Delete any comment
 *     description: Delete any comment regardless of approval status (Admin only)
 *     tags: [Admin - Comments]
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
 *       404:
 *         description: Comment not found
 */
router.delete('/:id', isAdmin, commentController.deleteComment);

module.exports = router;
