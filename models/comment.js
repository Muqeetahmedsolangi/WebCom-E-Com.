'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      // Comment belongs to a product
      Comment.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product',
      });

      // Comment belongs to a user
      Comment.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });

      // Comment can belong to a parent comment (for replies)
      Comment.belongsTo(models.Comment, {
        foreignKey: 'parentId',
        as: 'parent',
      });

      // Comment can have many replies
      Comment.hasMany(models.Comment, {
        foreignKey: 'parentId',
        as: 'replies',
      });
    }
  }

  Comment.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Product ID is required',
          },
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'User ID is required',
          },
        },
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Comment cannot be empty',
          },
        },
      },
      isApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'Comment',
      tableName: 'comments',
      hooks: {
        beforeCreate: async (comment) => {
          // Validate parent comment belongs to same product
          if (comment.parentId) {
            const parentComment = await sequelize.models.Comment.findByPk(comment.parentId);
            if (!parentComment) {
              throw new Error('Parent comment does not exist');
            }

            if (parentComment.productId !== comment.productId) {
              throw new Error('Parent comment must belong to the same product');
            }

            if (parentComment.parentId) {
              throw new Error('Nested replies are limited to one level');
            }
          }
        },
      },
    },
  );

  return Comment;
};
