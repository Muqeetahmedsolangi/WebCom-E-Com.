const bcrypt = require('bcrypt');
const { User, Role, Otp, sequelize } = require('../models');

class UserAuthService {
  /**
   * Find user by email
   */
  static async findUserByEmail(email, transaction = null) {
    return await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }],
      transaction,
    });
  }

  /**
   * Find user by ID
   */
  static async findUserById(id, transaction = null) {
    return await User.findOne({
      where: { id },
      include: [{ model: Role, as: 'role' }],
      transaction,
    });
  }

  /**
   * Create a new user
   */
  static async createUser(userData, transaction = null) {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    return await User.create(userData, { transaction });
  }

  /**
   * Update user data
   */
  static async updateUser(userId, updates, transaction = null) {
    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      throw new Error('User not found');
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    await user.update(updates, { transaction });
    return user;
  }

  /**
   * Verify user password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Check if existing OTP is still valid
   */
  static async hasActiveOtp(userId, transaction = null) {
    const otp = await Otp.findOne({
      where: {
        userId,
        isUsed: false,
        expiresAt: {
          [sequelize.Sequelize.Op.gt]: new Date(),
        },
      },
      order: [['createdAt', 'DESC']],
      transaction,
    });

    return !!otp;
  }

  /**
   * Get the time remaining for the most recent active OTP (in seconds)
   */
  static async getOtpTimeRemaining(userId, transaction = null) {
    const otp = await Otp.findOne({
      where: {
        userId,
        isUsed: false,
        expiresAt: {
          [sequelize.Sequelize.Op.gt]: new Date(),
        },
      },
      order: [['createdAt', 'DESC']],
      transaction,
    });

    if (!otp) return 0;

    const now = new Date();
    const expiresAt = new Date(otp.expiresAt);
    return Math.round((expiresAt - now) / 1000);
  }

  /**
   * Invalidate all existing OTPs for a user
   */
  static async invalidateAllOtps(userId, transaction = null) {
    return await Otp.update(
      { isUsed: true },
      {
        where: {
          userId,
          isUsed: false,
        },
        transaction,
      },
    );
  }
}

module.exports = UserAuthService;
