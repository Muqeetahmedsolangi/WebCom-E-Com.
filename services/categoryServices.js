const { Category, sequelize } = require('../models');
const { Op } = require('sequelize');

class CategoryService {
  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Created category
   */
  static async createCategory(categoryData, transaction = null) {
    return await Category.create(categoryData, { transaction });
  }

  /**
   * Find category by ID
   * @param {string} id - Category ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object|null>} Category or null
   */
  static async findCategoryById(id, transaction = null) {
    return await Category.findOne({
      where: { id },
      transaction,
    });
  }

  /**
   * Find category by slug
   * @param {string} slug - Category slug
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object|null>} Category or null
   */
  static async findCategoryBySlug(slug, transaction = null) {
    return await Category.findOne({
      where: { slug },
      transaction,
    });
  }

  /**
   * Check if slug exists
   * @param {string} slug - Category slug
   * @param {string} excludeId - Exclude category ID (for updates)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<boolean>} True if slug exists
   */
  static async isSlugExists(slug, excludeId = null, transaction = null) {
    const query = { slug };

    if (excludeId) {
      query.id = { [Op.ne]: excludeId };
    }

    const count = await Category.count({
      where: query,
      transaction,
    });

    return count > 0;
  }

  /**
   * Update category
   * @param {string} id - Category ID
   * @param {Object} updates - Update data
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<[number, Array]>} Update result
   */
  static async updateCategory(id, updates, transaction = null) {
    return await Category.update(updates, {
      where: { id },
      transaction,
      returning: true,
    });
  }

  /**
   * Toggle category status
   * @param {string} id - Category ID
   * @param {boolean} status - New status
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<[number, Array]>} Update result
   */
  static async toggleStatus(id, status, transaction = null) {
    return await Category.update(
      { isActive: status },
      {
        where: { id },
        transaction,
        returning: true,
      },
    );
  }

  /**
   * Delete a category
   * @param {string} id - Category ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<number>} Number of deleted rows
   */
  static async deleteCategory(id, transaction = null) {
    return await Category.destroy({
      where: { id },
      transaction,
    });
  }

  /**
   * Get all categories
   * @param {Object} options - Query options (pagination, sorting)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Categories with pagination info
   */
  static async getAllCategories(options = {}, transaction = null) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;

    const offset = (page - 1) * limit;

    const { count, rows } = await Category.findAndCountAll({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      transaction,
    });

    return {
      totalItems: count,
      categories: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Filter categories
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options (pagination, sorting)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Filtered categories with pagination info
   */
  static async filterCategories(filters = {}, options = {}, transaction = null) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (filters.name) {
      where.name = { [Op.like]: `%${filters.name}%` };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const { count, rows } = await Category.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      transaction,
    });

    return {
      totalItems: count,
      categories: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }
}

module.exports = CategoryService;
