'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      // Review belongs to a product
      Review.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product',
      });

      // Review belongs to a user
      Review.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    }
  }

  Review.init(
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
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Rating is required',
          },
          isInt: {
            msg: 'Rating must be an integer',
          },
          min: {
            args: [1],
            msg: 'Rating must be at least 1',
          },
          max: {
            args: [5],
            msg: 'Rating cannot be more than 5',
          },
        },
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Review comment cannot be empty',
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
      modelName: 'Review',
      tableName: 'reviews',
      hooks: {
        afterCreate: async (review, options) => {
          // Update product average rating and review count after creating a review
          if (review.isApproved) {
            await updateProductRating(review.productId, sequelize, options.transaction);
          }
        },
        afterUpdate: async (review, options) => {
          // Update product average rating when review is approved or rating changes
          if (review.changed('isApproved') || review.changed('rating')) {
            await updateProductRating(review.productId, sequelize, options.transaction);
          }
        },
        afterDestroy: async (review, options) => {
          // Update product average rating after deleting a review
          await updateProductRating(review.productId, sequelize, options.transaction);
        },
      },
    },
  );

  // Helper function to update product rating
  async function updateProductRating(productId, sequelize, transaction) {
    try {
      const { Review, Product } = sequelize.models;

      const stats = await Review.findOne({
        where: {
          productId: productId,
          isApproved: true,
        },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        raw: true,
      });

      if (stats) {
        await Product.update(
          {
            avgRating: parseFloat(stats.avgRating || 0).toFixed(2),
            reviewCount: parseInt(stats.count || 0),
          },
          {
            where: { id: productId },
            transaction: transaction,
          },
        );
      }
    } catch (error) {
      console.error('Error updating product rating stats:', error);
    }
  }

  return Review;
};
