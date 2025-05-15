const { Comment, User, Product, sequelize } = require('../models');
const { Op } = require('sequelize');

class CommentService {
  /**
   * Create a new comment
   * @param {Object} commentData - Comment data
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Created comment
   */
  static async createComment(commentData, transaction = null) {
    return await Comment.create(commentData, { transaction });
  }

  /**
   * Find comment by ID
   * @param {string} id - Comment ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object|null>} Comment or null
   */
  static async findCommentById(id, transaction = null) {
    return await Comment.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Comment,
          as: 'parent',
          attributes: ['id', 'content', 'createdAt'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username'],
            },
          ],
        },
      ],
      transaction,
    });
  }

  /**
   * Get comments by product ID
   * @param {string} productId - Product ID
   * @param {Object} options - Query options (pagination, sorting)
   * @param {boolean} approvedOnly - Only return approved comments
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Comments with pagination info
   */
  static async getCommentsByProduct(productId, options = {}, approvedOnly = true, transaction = null) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    const whereClause = {
      productId,
      parentId: null, // Only get root comments (not replies)
    };

    if (approvedOnly) {
      whereClause.isApproved = true;
    }

    const { count, rows } = await Comment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        },
        {
          model: Comment,
          as: 'replies',
          where: approvedOnly ? { isApproved: true } : {},
          required: false,
          separate: true,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username'],
            },
          ],
          order: [['createdAt', 'ASC']],
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      transaction,
    });

    return {
      totalItems: count,
      comments: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get comments by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options (pagination, sorting)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Comments with pagination info
   */
  static async getCommentsByUser(userId, options = {}, transaction = null) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    const { count, rows } = await Comment.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Comment,
          as: 'parent',
          attributes: ['id', 'content'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username'],
            },
          ],
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      transaction,
    });

    return {
      totalItems: count,
      comments: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get comments pending approval
   * @param {Object} options - Query options (pagination, sorting)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Comments with pagination info
   */
  static async getPendingComments(options = {}, transaction = null) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    const { count, rows } = await Comment.findAndCountAll({
      where: { isApproved: false },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Comment,
          as: 'parent',
          attributes: ['id', 'content'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username'],
            },
          ],
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      transaction,
    });

    return {
      totalItems: count,
      comments: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Update comment
   * @param {string} id - Comment ID
   * @param {Object} updates - Update data
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<[number, Array]>} Update result
   */
  static async updateComment(id, updates, transaction = null) {
    return await Comment.update(updates, {
      where: { id },
      transaction,
      returning: true,
    });
  }

  /**
   * Delete a comment
   * @param {string} id - Comment ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<number>} Number of deleted rows
   */
  static async deleteComment(id, transaction = null) {
    return await Comment.destroy({
      where: { id },
      transaction,
    });
  }

  /**
   * Check if user owns comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<boolean>} True if user owns comment
   */
  static async isUserCommentOwner(commentId, userId, transaction = null) {
    const count = await Comment.count({
      where: { id: commentId, userId },
      transaction,
    });
    return count > 0;
  }

  /**
   * Approve or reject a comment
   * @param {string} id - Comment ID
   * @param {boolean} approved - Approval status
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<[number, Array]>} Update result
   */
  static async approveComment(id, approved, transaction = null) {
    return await Comment.update(
      { isApproved: approved },
      {
        where: { id },
        transaction,
        returning: true,
      },
    );
  }
}

module.exports = CommentService;
