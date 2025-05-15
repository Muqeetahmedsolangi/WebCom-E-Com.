const fs = require('fs').promises;
const path = require('path');
const BaseController = require('../BaseController');
const CategoryService = require('../../services/categoryServices');
const { sequelize } = require('../../models');
class CategoryController extends BaseController {
  constructor() {
    super();
    this.createCategory = this.createCategory.bind(this);
    this.updateCategory = this.updateCategory.bind(this);
    this.toggleStatusCategory = this.toggleStatusCategory.bind(this);
    this.deleteCategory = this.deleteCategory.bind(this);
    this.adminGetAllCategories = this.adminGetAllCategories.bind(this);
    this.adminGetCategoryBySlug = this.adminGetCategoryBySlug.bind(this);
    this.adminFilterCategories = this.adminFilterCategories.bind(this);
  }

  /**
   * Create a new category with image upload
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async createCategory(req, res, next) {
    const { name, title, description } = req.body;
    const { id: userId } = req.user;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    let image = null;
    let transaction;

    try {
      if (!this.validateFields(req.body, ['name', 'title', 'description'])) {
        return this.handleError(next, 'Category name is required', 400);
      }
      transaction = await this.beginTransaction();
      const categoryDir = path.join(process.cwd(), 'uploads', 'categories');
      await fs.mkdir(categoryDir, { recursive: true });
      if (req.file) {
        image = this.createPath('categories/', req.file.originalname);
        await this.uploadFile({
          Key: image,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        });
      }
      const category = await CategoryService.createCategory(
        {
          userId,
          name,
          slug,
          title: title || name,
          description,
          image,
          isActive: true,
        },
        transaction,
      );
      await transaction.commit();
      return res.status(201).json({
        error: false,
        message: 'Category created successfully',
        category,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      if (image) {
        try {
          const filePath = path.join(process.cwd(), 'uploads', image);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteError) {
          console.error('Error deleting file after failed category creation:', deleteError);
        }
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return this.handleError(next, 'A category with this name already exists', 400);
      }
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Update category with image handling
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async updateCategory(req, res, next) {
    const { id } = req.params;
    const { name, title, description } = req.body;

    if (!id) {
      return this.handleError(next, 'Category ID is required', 400);
    }

    let image = null;
    let oldImage = null;
    let transaction;

    try {
      transaction = await this.beginTransaction();
      const category = await CategoryService.findCategoryById(id, transaction);
      if (!category) {
        await transaction.rollback();
        return this.handleError(next, 'Category not found', 404);
      }
      oldImage = category.image;
      const categoryDir = path.join(process.cwd(), 'uploads', 'categories');
      await fs.mkdir(categoryDir, { recursive: true });
      if (req.file) {
        image = this.createPath('categories/', req.file.originalname);
        await this.uploadFile({
          Key: image,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        });
      }
      const updates = {};
      if (name) {
        updates.name = name;
        const newSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
        if (newSlug !== category.slug) {
          const slugExists = await CategoryService.isSlugExists(newSlug, id, transaction);
          if (slugExists) {
            await transaction.rollback();
            if (image) {
              try {
                const newFilePath = path.join(process.cwd(), 'uploads', image);
                await fs.unlink(newFilePath);
              } catch (deleteError) {
                console.error('Error deleting file after slug conflict:', deleteError);
              }
            }

            return this.handleError(next, 'A category with this name already exists', 400);
          }
          updates.slug = newSlug;
        }
      }

      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (image) updates.image = image;
      if (Object.keys(updates).length === 0) {
        await transaction.rollback();
        if (image) {
          try {
            const newFilePath = path.join(process.cwd(), 'uploads', image);
            await fs.unlink(newFilePath);
          } catch (deleteError) {
            console.error('Error deleting unnecessary file:', deleteError);
          }
        }
        return res.status(200).json({
          error: false,
          message: 'No changes to update',
          category,
        });
      }
      const [updated, updatedCategories] = await CategoryService.updateCategory(id, updates, transaction);
      await transaction.commit();
      if (updated && oldImage && image) {
        try {
          const oldFilePath = path.join(process.cwd(), 'uploads', oldImage);
          await fs.unlink(oldFilePath).catch(() => {});
        } catch (deleteError) {
          console.error('Error deleting old image file:', deleteError);
        }
      }

      return res.status(200).json({
        error: false,
        message: 'Category updated successfully',
        category: updated ? updatedCategories[0] : category,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      if (image) {
        try {
          const newFilePath = path.join(process.cwd(), 'uploads', image);
          await fs.unlink(newFilePath).catch(() => {});
        } catch (deleteError) {
          console.error('Error deleting file after failed update:', deleteError);
        }
      }

      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Delete category and its image
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async deleteCategory(req, res, next) {
    const { id } = req.params;

    if (!id) {
      return this.handleError(next, 'Category ID is required', 400);
    }

    let transaction;
    let categoryImage = null;

    try {
      transaction = await this.beginTransaction();

      const category = await CategoryService.findCategoryById(id, transaction);
      if (!category) {
        await transaction.rollback();
        return this.handleError(next, 'Category not found', 404);
      }
      categoryImage = category.image;
      await CategoryService.deleteCategory(id, transaction);
      await transaction.commit();
      if (categoryImage) {
        try {
          const filePath = path.join(process.cwd(), 'uploads', categoryImage);
          await fs.unlink(filePath).catch(() => {});
        } catch (deleteError) {
          console.error('Error deleting category image:', deleteError);
        }
      }
      return res.status(200).json({
        error: false,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Toggle category active status
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async toggleStatusCategory(req, res, next) {
    const { id } = req.params;
    const { status } = req.body;
    if (!id) {
      return this.handleError(next, 'Category ID is required', 400);
    }
    if (status === undefined) {
      return this.handleError(next, 'Status is required', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();
      const category = await CategoryService.findCategoryById(id, transaction);
      if (!category) {
        await transaction.rollback();
        return this.handleError(next, 'Category not found', 404);
      }
      const [updated, updatedCategories] = await CategoryService.toggleStatus(id, status, transaction);
      await transaction.commit();
      return res.status(200).json({
        error: false,
        message: `Category ${status ? 'activated' : 'deactivated'} successfully`,
        category: updated ? updatedCategories[0] : category,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Admin: Get all categories with pagination (including inactive)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async adminGetAllCategories(req, res, next) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    let transaction;
    try {
      transaction = await this.beginTransaction();
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder,
      };
      const result = await CategoryService.getAllCategories(options, transaction);
      await transaction.commit();
      return res.status(200).json({
        error: false,
        message: 'Categories retrieved successfully',
        ...result,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Admin: Get category by slug (including inactive)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async adminGetCategoryBySlug(req, res, next) {
    const { slug } = req.params;
    if (!slug) {
      return this.handleError(next, 'Category slug is required', 400);
    }
    let transaction;
    try {
      transaction = await this.beginTransaction();
      const category = await CategoryService.findCategoryBySlug(slug, transaction);
      if (!category) {
        await transaction.rollback();
        return this.handleError(next, 'Category not found', 404);
      }
      await transaction.commit();
      return res.status(200).json({
        error: false,
        message: 'Category retrieved successfully',
        category,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Admin: Filter categories (including inactive)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async adminFilterCategories(req, res, next) {
    const { name, isActive } = req.query;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    let transaction;
    try {
      transaction = await this.beginTransaction();

      const filters = {};
      if (name) filters.name = name;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder,
      };

      const result = await CategoryService.filterCategories(filters, options, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Categories filtered successfully',
        ...result,
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

module.exports = new CategoryController();
