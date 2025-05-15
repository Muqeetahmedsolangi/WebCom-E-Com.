const { User, Role, sequelize } = require('../models');
const bcrypt = require('bcrypt');

class AuthService {
  /**
   * Find user by email
   * @param {string} email - User email
   * @param {object} transaction - Sequelize transaction object
   * @returns {Promise<object|null>} User object or null
   */
  static async findUserByEmail(email, transaction = null) {
    return await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: 'role',
        },
      ],
      transaction,
    });
  }

  /**
   * Create a new user
   * @param {object} userData - User data
   * @param {object} transaction - Sequelize transaction object
   * @returns {Promise<object>} Created user
   */
  static async createUser(userData, transaction = null) {
    // Hash the password before storing
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    return await User.create(userData, { transaction });
  }

  /**
   * Verify if password matches
   * @param {string} inputPassword - Plain text password to verify
   * @param {string} hashedPassword - Stored hashed password
   * @returns {Promise<boolean>} True if password matches, false otherwise
   */
  static async verifyPassword(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }

  /**
   * Check if a user with admin role exists
   * @param {object} transaction - Sequelize transaction object
   * @returns {Promise<boolean>} True if an admin exists, false otherwise
   */
  static async adminExists(transaction = null) {
    const count = await User.count({
      where: { roleId: 1 }, // Admin role ID
      transaction,
    });

    return count > 0;
  }

  /**
   * Create a transaction
   * @returns {Promise<object>} Sequelize transaction
   */
  static async createTransaction() {
    return await sequelize.transaction();
  }
}

module.exports = AuthService;
