const BaseController = require('../BaseController');
const CategoryService = require('../../services/categoryServices');
const { sequelize } = require('../../models');

class PublicCategoryController extends BaseController {
  constructor() {
    super();
    this.getAllCategories = this.getAllCategories.bind(this);
    this.getCategoryBySlug = this.getCategoryBySlug.bind(this);
    this.filterCategories = this.filterCategories.bind(this);
  }

  /**
   * Get all active categories with pagination
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async getAllCategories(req, res, next) {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC' } = req.query;

    try {
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder,
      };
      const filters = { isActive: true };
      const result = await CategoryService.filterCategories(filters, options);

      return res.status(200).json({
        error: false,
        message: 'Categories retrieved successfully',
        ...result,
      });
    } catch (error) {
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Get category by slug
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async getCategoryBySlug(req, res, next) {
    const { slug } = req.params;

    if (!slug) {
      return this.handleError(next, 'Category slug is required', 400);
    }
    try {
      const category = await CategoryService.findCategoryBySlug(slug);
      if (!category) {
        return this.handleError(next, 'Category not found', 404);
      }
      if (!category.isActive) {
        return this.handleError(next, 'Category not found', 404);
      }

      return res.status(200).json({
        error: false,
        message: 'Category retrieved successfully',
        category,
      });
    } catch (error) {
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Filter categories (public version - only returns active categories)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async filterCategories(req, res, next) {
    const { name } = req.query;
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC' } = req.query;

    try {
      const filters = {
        isActive: true,
      };
      if (name) filters.name = name;
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder,
      };
      const result = await CategoryService.filterCategories(filters, options);
      return res.status(200).json({
        error: false,
        message: 'Categories filtered successfully',
        ...result,
      });
    } catch (error) {
      return this.handleError(next, error.message, 500);
    }
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

module.exports = new PublicCategoryController();
