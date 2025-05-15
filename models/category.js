'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      // Category belongs to a user (creator/admin)
      Category.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'creator',
      });

      // A category can have many products (assuming you'll create a Product model)
      if (models.Product) {
        Category.hasMany(models.Product, {
          foreignKey: 'categoryId',
          as: 'products',
        });
      }
    }
  }

  Category.init(
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
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Category name cannot be empty',
          },
        },
      },
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true, // This ensures slugs are unique at the model level
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
      image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'Category',
      tableName: 'categories',
      hooks: {
        beforeValidate: (category) => {
          // Generate slug from name if not provided
          if (category.name && (!category.slug || category.changed('name'))) {
            category.slug = category.name
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-');
          }
        },
      },
      indexes: [
        {
          unique: true,
          fields: ['slug'],
        },
        {
          fields: ['name'],
        },
        {
          fields: ['userId'],
        },
      ],
    },
  );

  return Category;
};
