const bcrypt = require('bcrypt');
const { User, Role, sequelize } = require('../../models');
const BaseController = require('../BaseController');
const ProductService = require('../../services/productServices');
const CategoryService = require('../../services/categoryServices');

class PublicController extends BaseController {
  constructor() {
    super();

    this.getProducts = this.getProducts.bind(this);
    this.getProductById = this.getProductById.bind(this);
    this.getProductBySlug = this.getProductBySlug.bind(this);
    this.searchProducts = this.searchProducts.bind(this);
    this.getFeaturedProducts = this.getFeaturedProducts.bind(this);
    this.getProductsByCategory = this.getProductsByCategory.bind(this);
    this.getProductsByCategorySlug = this.getProductsByCategorySlug.bind(this);
  }

  /**
   * Get all active products with pagination
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async getProducts(req, res, next) {
    const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    let transaction;
    try {
      transaction = await this.beginTransaction();

      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder,
      };

      // Only show active products to public users
      const filters = { isActive: true };

      const result = await ProductService.filterProducts(filters, options, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Products retrieved successfully',
        ...result,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Get product by ID (only active products)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async getProductById(req, res, next) {
    const { id } = req.params;

    if (!id) {
      return this.handleError(next, 'Product ID is required', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();

      const product = await ProductService.findProductById(id, transaction);

      // Check if product exists and is active
      if (!product || !product.isActive) {
        await transaction.rollback();
        return this.handleError(next, 'Product not found', 404);
      }

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Product retrieved successfully',
        product,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Get product by slug (only active products)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async getProductBySlug(req, res, next) {
    const { slug } = req.params;

    if (!slug) {
      return this.handleError(next, 'Product slug is required', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();

      const product = await ProductService.findProductBySlug(slug, transaction);

      // Check if product exists and is active
      if (!product || !product.isActive) {
        await transaction.rollback();
        return this.handleError(next, 'Product not found', 404);
      }

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Product retrieved successfully',
        product,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Search products with filters (only active products)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async searchProducts(req, res, next) {
    const { name, categoryId, minPrice, maxPrice, page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    let transaction;
    try {
      transaction = await this.beginTransaction();

      // Build filters
      const filters = { isActive: true }; // Only show active products
      if (name) filters.name = name;
      if (categoryId) filters.categoryId = categoryId;
      if (minPrice !== undefined) filters.minPrice = parseFloat(minPrice);
      if (maxPrice !== undefined) filters.maxPrice = parseFloat(maxPrice);

      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder,
      };

      const result = await ProductService.filterProducts(filters, options, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Products retrieved successfully',
        ...result,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Get featured products (only active products)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async getFeaturedProducts(req, res, next) {
    const { limit = 8 } = req.query;

    let transaction;
    try {
      transaction = await this.beginTransaction();

      const options = {
        page: 1,
        limit: parseInt(limit, 10),
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      // Only show active and featured products
      const filters = {
        isActive: true,
        featured: true,
      };

      const result = await ProductService.filterProducts(filters, options, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Featured products retrieved successfully',
        ...result,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Get products by category ID (only active products)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async getProductsByCategory(req, res, next) {
    const { categoryId } = req.params;
    const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    if (!categoryId) {
      return this.handleError(next, 'Category ID is required', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();

      // Check if category exists and is active
      const category = await CategoryService.findCategoryById(categoryId, transaction);
      if (!category || !category.isActive) {
        await transaction.rollback();
        return this.handleError(next, 'Category not found', 404);
      }

      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder,
      };

      const result = await ProductService.getProductsByCategory(categoryId, options, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Products retrieved successfully',
        ...result,
        category,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Get products by category slug (only active products)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async getProductsByCategorySlug(req, res, next) {
    const { slug } = req.params;
    const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    if (!slug) {
      return this.handleError(next, 'Category slug is required', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();

      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder,
      };

      const result = await ProductService.getProductsByCategorySlug(slug, options, transaction);

      if (result.error) {
        await transaction.rollback();
        return this.handleError(next, result.error, 404);
      }

      // Make sure the category is active
      if (!result.category || !result.category.isActive) {
        await transaction.rollback();
        return this.handleError(next, 'Category not found or inactive', 404);
      }

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Products retrieved successfully',
        ...result,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }
}

module.exports = new PublicController();
