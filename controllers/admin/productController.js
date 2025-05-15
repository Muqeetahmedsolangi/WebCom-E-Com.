const fs = require('fs').promises;
const path = require('path');
const BaseController = require('../BaseController');
const CategoryService = require('../../services/categoryServices');
const ProductService = require('../../services/productServices');
const { sequelize } = require('../../models');

class ProductController extends BaseController {
  constructor() {
    super();

    this.createProduct = this.createProduct.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.toggleProductStatus = this.toggleProductStatus.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
  }

  /**
   * Create a new product with multiple image uploads
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async createProduct(req, res, next) {
    const { name, price, discountPrice, description, shortDescription, categoryId, title, quantity } = req.body;
    const { id: userId } = req.user;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    let images = [];
    let transaction;

    try {
      if (!this.validateFields(req.body, ['name', 'price', 'categoryId'])) {
        return this.handleError(next, 'Product name, price, and category are required', 400);
      }
      const category = await CategoryService.findCategoryById(categoryId);
      if (!category) {
        return this.handleError(next, 'Category not found', 404);
      }
      transaction = await this.beginTransaction();
      const productDir = path.join(process.cwd(), 'uploads', 'products');
      await fs.mkdir(productDir, { recursive: true });
      if (req.files && req.files.length > 0) {
        const filesToProcess = req.files.slice(0, 10);
        for (const file of filesToProcess) {
          const imagePath = this.createPath('products/', file.originalname);
          await this.uploadFile({
            Key: imagePath,
            Body: file.buffer,
            ContentType: file.mimetype,
          });
          images.push(imagePath);
        }
      }
      const product = await ProductService.createProduct(
        {
          userId,
          categoryId,
          name,
          slug,
          title: title || name,
          description,
          shortDescription,
          price,
          discountPrice,
          quantity: parseInt(quantity) || 0,
          images,
          isActive: true,
        },
        transaction,
      );

      await transaction.commit();

      return res.status(201).json({
        error: false,
        message: 'Product created successfully',
        product,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      if (images.length > 0) {
        try {
          for (const image of images) {
            const filePath = path.join(process.cwd(), 'uploads', image);
            await fs.unlink(filePath).catch(() => {});
          }
        } catch (deleteError) {
          console.error('Error deleting files after failed product creation:', deleteError);
        }
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        return this.handleError(next, 'A product with this name already exists', 400);
      }

      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Update product with image handling
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async updateProduct(req, res, next) {
    const { id } = req.params;
    const { name, price, discountPrice, description, shortDescription, categoryId, title, quantity, featured, removeImages } = req.body;

    if (!id) {
      return this.handleError(next, 'Product ID is required', 400);
    }

    let newImages = [];
    let transaction;

    try {
      transaction = await this.beginTransaction();
      const product = await ProductService.findProductById(id, transaction);
      if (!product) {
        await transaction.rollback();
        return this.handleError(next, 'Product not found', 404);
      }
      if (categoryId) {
        const category = await CategoryService.findCategoryById(categoryId, transaction);
        if (!category) {
          await transaction.rollback();
          return this.handleError(next, 'Category not found', 404);
        }
      }
      const productDir = path.join(process.cwd(), 'uploads', 'products');
      await fs.mkdir(productDir, { recursive: true });
      let existingImages = product.images || [];
      if (removeImages && Array.isArray(removeImages)) {
        const indicesToRemove = removeImages.map((index) => parseInt(index, 10));
        const imagesToDelete = [];
        existingImages = existingImages.filter((img, index) => {
          const shouldRemove = indicesToRemove.includes(index);
          if (shouldRemove) imagesToDelete.push(img);
          return !shouldRemove;
        });
        if (transaction.afterCommit) {
          transaction.afterCommit(() => {
            for (const image of imagesToDelete) {
              const filePath = path.join(process.cwd(), 'uploads', image);
              fs.unlink(filePath).catch((err) => {
                console.error('Error removing image file:', err);
              });
            }
          });
        }
      }
      if (req.files && req.files.length > 0) {
        const slotsRemaining = 10 - existingImages.length;
        if (slotsRemaining > 0) {
          const filesToProcess = req.files.slice(0, slotsRemaining);
          for (const file of filesToProcess) {
            const imagePath = this.createPath('products/', file.originalname);
            await this.uploadFile({
              Key: imagePath,
              Body: file.buffer,
              ContentType: file.mimetype,
            });
            newImages.push(imagePath);
          }
        }
      }
      const finalImages = [...existingImages, ...newImages];
      const updates = {};
      if (name) {
        updates.name = name;
        const newSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');

        if (newSlug !== product.slug) {
          const slugExists = await ProductService.isSlugExists(newSlug, id, transaction);
          if (slugExists) {
            await transaction.rollback();
            if (newImages.length > 0) {
              try {
                for (const image of newImages) {
                  const filePath = path.join(process.cwd(), 'uploads', image);
                  await fs.unlink(filePath).catch(() => {});
                }
              } catch (deleteError) {
                console.error('Error deleting files after slug conflict:', deleteError);
              }
            }
            return this.handleError(next, 'A product with this name already exists', 400);
          }
          updates.slug = newSlug;
        }
      }
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (shortDescription !== undefined) updates.shortDescription = shortDescription;
      if (price !== undefined) updates.price = parseFloat(price);
      if (discountPrice !== undefined) updates.discountPrice = parseFloat(discountPrice) || null;
      if (quantity !== undefined) updates.quantity = parseInt(quantity);
      if (categoryId) updates.categoryId = categoryId;
      if (featured !== undefined) updates.featured = featured === 'true';
      if (finalImages.length > 0) updates.images = finalImages;
      if (Object.keys(updates).length === 0) {
        await transaction.rollback();
        if (newImages.length > 0) {
          try {
            for (const image of newImages) {
              const filePath = path.join(process.cwd(), 'uploads', image);
              await fs.unlink(filePath).catch(() => {});
            }
          } catch (deleteError) {
            console.error('Error deleting unnecessary files:', deleteError);
          }
        }

        return res.status(200).json({
          error: false,
          message: 'No changes to update',
          product,
        });
      }
      const [updated, updatedProducts] = await ProductService.updateProduct(id, updates, transaction);
      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Product updated successfully',
        product: updated ? updatedProducts[0] : product,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      if (newImages.length > 0) {
        try {
          for (const image of newImages) {
            const filePath = path.join(process.cwd(), 'uploads', image);
            await fs.unlink(filePath).catch(() => {});
          }
        } catch (deleteError) {
          console.error('Error deleting files after failed update:', deleteError);
        }
      }

      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Delete product and its images
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async deleteProduct(req, res, next) {
    const { id } = req.params;

    if (!id) {
      return this.handleError(next, 'Product ID is required', 400);
    }

    let transaction;
    let productImages = [];

    try {
      transaction = await this.beginTransaction();
      const product = await ProductService.findProductById(id, transaction);
      if (!product) {
        await transaction.rollback();
        return this.handleError(next, 'Product not found', 404);
      }
      productImages = product.images || [];
      await ProductService.deleteProduct(id, transaction);
      await transaction.commit();
      if (productImages.length > 0) {
        try {
          for (const image of productImages) {
            const filePath = path.join(process.cwd(), 'uploads', image);
            await fs.unlink(filePath).catch(() => {});
          }
        } catch (deleteError) {
          console.error('Error deleting product images:', deleteError);
        }
      }

      return res.status(200).json({
        error: false,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Toggle product active status
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async toggleProductStatus(req, res, next) {
    const { id } = req.params;
    const { status } = req.body;
    if (!id) {
      return this.handleError(next, 'Product ID is required', 400);
    }

    if (status === undefined) {
      return this.handleError(next, 'Status is required', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();
      const product = await ProductService.findProductById(id, transaction);
      if (!product) {
        await transaction.rollback();
        return this.handleError(next, 'Product not found', 404);
      }
      const [updated, updatedProducts] = await ProductService.toggleStatus(id, status, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: `Product ${status ? 'activated' : 'deactivated'} successfully`,
        product: updated ? updatedProducts[0] : product,
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
   * Helper method to create a file path
   */
  createPath(prefix, filename) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const sanitizedFilename = filename.toLowerCase().replace(/[^a-z0-9.]/g, '-');
    return `${prefix}${timestamp}-${randomString}-${sanitizedFilename}`;
  }

  /**
   * Helper method to upload a file
   */
  async uploadFile(params) {
    // Write file to disk
    const filePath = path.join(process.cwd(), 'uploads', params.Key);
    await fs.writeFile(filePath, params.Body);
    return filePath;
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

module.exports = new ProductController();
