const BaseController = require('../BaseController');
const CommentService = require('../../services/commentService');
const { sequelize } = require('../../models');

class AdminCommentController extends BaseController {
  constructor() {
    super();

    // Bind methods
    this.getPendingComments = this.getPendingComments.bind(this);
    this.approveComment = this.approveComment.bind(this);
    this.rejectComment = this.rejectComment.bind(this);
    this.deleteComment = this.deleteComment.bind(this);
  }

  /**
   * Get all pending comments
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async getPendingComments(req, res, next) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    try {
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
      };

      const comments = await CommentService.getPendingComments(options);

      return res.status(200).json({
        error: false,
        message: 'Pending comments retrieved successfully',
        ...comments,
      });
    } catch (error) {
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Approve a comment
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async approveComment(req, res, next) {
    const { id } = req.params;

    if (!id) {
      return this.handleError(next, 'Comment ID is required', 400);
    }

    let transaction;

    try {
      transaction = await this.beginTransaction();

      // Check if comment exists
      const comment = await CommentService.findCommentById(id, transaction);
      if (!comment) {
        await transaction.rollback();
        return this.handleError(next, 'Comment not found', 404);
      }

      // If already approved, return early
      if (comment.isApproved) {
        await transaction.rollback();
        return res.status(200).json({
          error: false,
          message: 'Comment is already approved',
          comment,
        });
      }

      // Approve the comment
      const [updated, updatedComments] = await CommentService.approveComment(id, true, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Comment approved successfully',
        comment: updated ? updatedComments[0] : comment,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Reject a comment (delete it)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async rejectComment(req, res, next) {
    const { id } = req.params;

    if (!id) {
      return this.handleError(next, 'Comment ID is required', 400);
    }

    let transaction;

    try {
      transaction = await this.beginTransaction();

      // Check if comment exists
      const comment = await CommentService.findCommentById(id, transaction);
      if (!comment) {
        await transaction.rollback();
        return this.handleError(next, 'Comment not found', 404);
      }

      // Delete/reject the comment
      await CommentService.deleteComment(id, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Comment rejected and deleted successfully',
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Delete any comment (admin can delete any comment)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async deleteComment(req, res, next) {
    const { id } = req.params;

    if (!id) {
      return this.handleError(next, 'Comment ID is required', 400);
    }

    let transaction;

    try {
      transaction = await this.beginTransaction();

      // Check if comment exists
      const comment = await CommentService.findCommentById(id, transaction);
      if (!comment) {
        await transaction.rollback();
        return this.handleError(next, 'Comment not found', 404);
      }

      // Delete the comment
      await CommentService.deleteComment(id, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Helper method to begin a transaction
   */
  async beginTransaction() {
    return await sequelize.transaction();
  }

  /**
   * Helper method to handle errors
   */
  handleError(next, message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return next(error);
  }
}

module.exports = new AdminCommentController();
