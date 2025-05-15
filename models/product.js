'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // Product belongs to a category
      Product.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category',
      });

      // Product belongs to a user (creator/admin)
      Product.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'creator',
      });

      // Product has many reviews
      Product.hasMany(models.Review, {
        foreignKey: 'productId',
        as: 'reviews',
      });

      // Product has many comments
      Product.hasMany(models.Comment, {
        foreignKey: 'productId',
        as: 'comments',
      });
    }

    // Get featured image from array
    getFeaturedImage() {
      const images = this.images || [];
      return images.length > 0 ? images[0] : null;
    }
  }

  Product.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Creator user ID is required',
          },
        },
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Category ID is required',
          },
        },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Product name cannot be empty',
          },
        },
      },
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: 'Slug cannot be empty',
          },
        },
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      shortDescription: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          isDecimal: {
            msg: 'Price must be a valid decimal',
          },
          min: {
            args: [0],
            msg: 'Price cannot be negative',
          },
        },
      },
      discountPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          isDecimal: {
            msg: 'Discount price must be a valid decimal',
          },
          min: {
            args: [0],
            msg: 'Discount price cannot be negative',
          },
          isLessThanPrice(value) {
            if (value && parseFloat(value) >= parseFloat(this.price)) {
              throw new Error('Discount price must be less than regular price');
            }
          },
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          isInt: {
            msg: 'Quantity must be a valid integer',
          },
          min: {
            args: [0],
            msg: 'Quantity cannot be negative',
          },
        },
      },
      images: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        validate: {
          isValidImagesArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('Images must be an array');
            }

            if (value.length > 10) {
              throw new Error('Maximum 10 images allowed');
            }
          },
        },
        get() {
          const rawValue = this.getDataValue('images');
          return rawValue ? (Array.isArray(rawValue) ? rawValue : JSON.parse(rawValue)) : [];
        },
        set(value) {
          this.setDataValue(
            'images',
            Array.isArray(value)
              ? value.slice(0, 10) // Limit to 10 images
              : value
              ? JSON.parse(value).slice(0, 10)
              : [],
          );
        },
      },
      featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      avgRating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0,
      },
      reviewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'products',
      hooks: {
        beforeValidate: (product) => {
          // Generate slug from name if not provided
          if (product.name && (!product.slug || product.changed('name'))) {
            product.slug = product.name
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-');
          }
        },
      },
    },
  );

  return Product;
};
