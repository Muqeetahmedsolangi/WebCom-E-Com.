const BaseController = require('../BaseController');
const CommentService = require('../../services/commentService');
const ProductService = require('../../services/productServices');
const { sequelize } = require('../../models');

class UserCommentController extends BaseController {
  constructor() {
    super();

    // Bind methods
    this.createComment = this.createComment.bind(this);
    this.getMyComments = this.getMyComments.bind(this);
    this.getProductComments = this.getProductComments.bind(this);
    this.deleteComment = this.deleteComment.bind(this);
    this.replyToComment = this.replyToComment.bind(this);
  }

  /**
   * Create a new product comment
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async createComment(req, res, next) {
    const { productId, content } = req.body;
    const { id: userId } = req.user;

    // Validate required fields
    if (!this.validateFields(req.body, ['productId', 'content'])) {
      return this.handleError(next, 'Product ID and comment content are required', 400);
    }

    // Validate content is not empty
    if (!content || content.trim() === '') {
      return this.handleError(next, 'Comment content cannot be empty', 400);
    }

    let transaction;

    try {
      transaction = await this.beginTransaction();

      // Check if product exists and is active
      const product = await ProductService.findProductById(productId, transaction);
      if (!product) {
        await transaction.rollback();
        return this.handleError(next, 'Product not found', 404);
      }

      if (!product.isActive) {
        await transaction.rollback();
        return this.handleError(next, 'Cannot comment on an inactive product', 400);
      }

      // Create the comment - initially not approved
      const comment = await CommentService.createComment(
        {
          userId,
          productId,
          content: content.trim(),
          isApproved: false, // Comments require approval by admin
        },
        transaction,
      );

      await transaction.commit();

      return res.status(201).json({
        error: false,
        message: 'Comment submitted successfully and pending approval',
        comment,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Reply to an existing comment
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async replyToComment(req, res, next) {
    const { parentId, content } = req.body;
    const { id: userId } = req.user;

    // Validate required fields
    if (!this.validateFields(req.body, ['parentId', 'content'])) {
      return this.handleError(next, 'Parent comment ID and reply content are required', 400);
    }

    // Validate content is not empty
    if (!content || content.trim() === '') {
      return this.handleError(next, 'Reply content cannot be empty', 400);
    }

    let transaction;

    try {
      transaction = await this.beginTransaction();

      // Check if parent comment exists and is approved
      const parentComment = await CommentService.findCommentById(parentId, transaction);
      if (!parentComment) {
        await transaction.rollback();
        return this.handleError(next, 'Parent comment not found', 404);
      }

      if (!parentComment.isApproved) {
        await transaction.rollback();
        return this.handleError(next, 'Cannot reply to an unapproved comment', 400);
      }

      // Prevent nested replies (only allow one level of nesting)
      if (parentComment.parentId) {
        await transaction.rollback();
        return this.handleError(next, 'Nested replies are not allowed', 400);
      }

      // Create the reply - initially not approved
      const reply = await CommentService.createComment(
        {
          userId,
          productId: parentComment.productId,
          parentId,
          content: content.trim(),
          isApproved: false, // Replies also require approval
        },
        transaction,
      );

      await transaction.commit();

      return res.status(201).json({
        error: false,
        message: 'Reply submitted successfully and pending approval',
        comment: reply,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Get current user's comments
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async getMyComments(req, res, next) {
    const { id: userId } = req.user;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    try {
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
      };

      const comments = await CommentService.getCommentsByUser(userId, options);

      return res.status(200).json({
        error: false,
        message: 'Comments retrieved successfully',
        ...comments,
      });
    } catch (error) {
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Get comments for a specific product
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async getProductComments(req, res, next) {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    if (!productId) {
      return this.handleError(next, 'Product ID is required', 400);
    }

    try {
      // Check if product exists
      const product = await ProductService.findProductById(productId);
      if (!product) {
        return this.handleError(next, 'Product not found', 404);
      }

      if (!product.isActive) {
        return this.handleError(next, 'Product is not active', 404);
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
      };

      // Public route - only return approved comments
      const comments = await CommentService.getCommentsByProduct(productId, options, true);

      return res.status(200).json({
        error: false,
        message: 'Product comments retrieved successfully',
        ...comments,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
        },
      });
    } catch (error) {
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Delete user's own comment
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async deleteComment(req, res, next) {
    const { id } = req.params;
    const { id: userId } = req.user;

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

      // Check if user owns the comment
      if (comment.userId !== userId) {
        await transaction.rollback();
        return this.handleError(next, 'You can only delete your own comments', 403);
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
   * Helper method to validate required fields
   */
  validateFields(data, requiredFields) {
    for (const field of requiredFields) {
      if (!data[field]) {
        return false;
      }
    }
    return true;
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

module.exports = new UserCommentController();
