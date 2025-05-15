const { Product, Category, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class ProductService {
  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Created product
   */
  static async createProduct(productData, transaction = null) {
    return await Product.create(productData, { transaction });
  }

  /**
   * Find product by ID
   * @param {string} id - Product ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object|null>} Product or null
   */
  static async findProductById(id, transaction = null) {
    return await Product.findOne({
      where: { id },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username'],
        },
      ],
      transaction,
    });
  }

  /**
   * Find product by slug
   * @param {string} slug - Product slug
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object|null>} Product or null
   */
  static async findProductBySlug(slug, transaction = null) {
    return await Product.findOne({
      where: { slug },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      transaction,
    });
  }

  /**
   * Check if slug exists
   * @param {string} slug - Product slug
   * @param {string} excludeId - Exclude product ID (for updates)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<boolean>} True if slug exists
   */
  static async isSlugExists(slug, excludeId = null, transaction = null) {
    const query = { slug };

    if (excludeId) {
      query.id = { [Op.ne]: excludeId };
    }

    const count = await Product.count({
      where: query,
      transaction,
    });

    return count > 0;
  }

  /**
   * Update product
   * @param {string} id - Product ID
   * @param {Object} updates - Update data
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<[number, Array]>} Update result
   */
  static async updateProduct(id, updates, transaction = null) {
    return await Product.update(updates, {
      where: { id },
      transaction,
      returning: true,
    });
  }

  /**
   * Toggle product status
   * @param {string} id - Product ID
   * @param {boolean} status - New status
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<[number, Array]>} Update result
   */
  static async toggleStatus(id, status, transaction = null) {
    return await Product.update(
      { isActive: status },
      {
        where: { id },
        transaction,
        returning: true,
      },
    );
  }

  /**
   * Delete a product
   * @param {string} id - Product ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<number>} Number of deleted rows
   */
  static async deleteProduct(id, transaction = null) {
    return await Product.destroy({
      where: { id },
      transaction,
    });
  }

  /**
   * Get all products
   * @param {Object} options - Query options (pagination, sorting)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Products with pagination info
   */
  static async getAllProducts(options = {}, transaction = null) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;

    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      transaction,
    });

    return {
      totalItems: count,
      products: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Filter products
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options (pagination, sorting)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Filtered products with pagination info
   */
  static async filterProducts(filters = {}, options = {}, transaction = null) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;

    const offset = (page - 1) * limit;
    const where = {};
    const include = [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
    ];

    // Apply filters
    if (filters.name) {
      where.name = { [Op.like]: `%${filters.name}%` };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.minPrice !== undefined) {
      where.price = {
        ...(where.price || {}),
        [Op.gte]: filters.minPrice,
      };
    }

    if (filters.maxPrice !== undefined) {
      where.price = {
        ...(where.price || {}),
        [Op.lte]: filters.maxPrice,
      };
    }

    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      transaction,
    });

    return {
      totalItems: count,
      products: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get products by category ID
   * @param {string} categoryId - Category ID
   * @param {Object} options - Query options (pagination, sorting)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Products with pagination info
   */
  static async getProductsByCategory(categoryId, options = {}, transaction = null) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;

    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      where: { categoryId, isActive: true },
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      transaction,
    });

    return {
      totalItems: count,
      products: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get products by category slug
   * @param {string} categorySlug - Category slug
   * @param {Object} options - Query options (pagination, sorting)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Products with pagination info
   */
  static async getProductsByCategorySlug(categorySlug, options = {}, transaction = null) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;

    // First find the category
    const category = await Category.findOne({
      where: { slug: categorySlug },
      transaction,
    });

    if (!category) {
      return {
        totalItems: 0,
        products: [],
        currentPage: page,
        totalPages: 0,
        error: 'Category not found',
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      where: { categoryId: category.id, isActive: true },
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      transaction,
    });

    return {
      totalItems: count,
      products: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      category,
    };
  }
}

module.exports = ProductService;
