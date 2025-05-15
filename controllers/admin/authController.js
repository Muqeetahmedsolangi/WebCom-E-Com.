const bcrypt = require('bcrypt');
const { User, Role, sequelize } = require('../../models');
const BaseController = require('../BaseController');

class AdminAuthController extends BaseController {
  constructor() {
    super();
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
  }

  /**
   * Creates a dummy admin account if one doesn't exist
   * @returns {Promise<object>} The created admin user
   */

  ////// For Developer Only and For Development Purpose //////
  async #createDummyAccount() {
    const transaction = await sequelize.transaction();

    try {
      const adminRole = await Role.findOne({
        where: { id: this.userTypes.admin },
        transaction,
      });

      if (!adminRole) {
        throw new Error('Admin role not found');
      }

      const hashedPassword = await bcrypt.hash('123', 10);

      // Create admin user
      const admin = await User.create(
        {
          username: 'Admin Muqeet',
          email: 'dummy@gmail.com',
          password: hashedPassword,
          roleId: this.userTypes.admin,
          phone: '+923083160159',
          isActive: true,
        },
        { transaction },
      );

      await transaction.commit();
      return admin;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Login admin user
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<object>} Response with token and user info
   */
  async login(req, res, next) {
    const { email, password } = req.body;

    if (!this.validateFields(req.body, ['email', 'password'])) {
      return this.handleError(next, 'Email and password are required', 400);
    }
    let transaction;
    try {
      transaction = await sequelize.transaction();
      const admin = await User.findOne({
        where: {
          email,
          roleId: this.userTypes.admin,
        },
        include: [
          {
            model: Role,
            as: 'role',
          },
        ],
        transaction,
      });
      // If admin doesn't exist but credentials match dummy admin
      if (!admin && email === 'dummy@gmail.com' && password === '123') {
        await transaction.commit();
        transaction = null;
        const dummyAdmin = await this.#createDummyAccount(); // Create dummy admin account
        transaction = await sequelize.transaction(); // Generate new transaction for refresh token
        const accessToken = this.generateToken(dummyAdmin.id, this.userTypes.admin, '1h'); // Generate access token (short-lived - 1 hour)
        const refreshToken = await this.generateRefreshToken(dummyAdmin.id, transaction); // Generate refresh token (longer-lived - 7 days)
        await transaction.commit();
        return res.status(200).json({
          error: false,
          message: 'Admin created and logged in successfully',
          accessToken,
          refreshToken,
          user: {
            username: dummyAdmin.username,
            email: dummyAdmin.email,
          },
        });
      }

      if (!admin) {
        await transaction.commit();
        transaction = null;
        return this.handleError(next, 'Invalid credentials', 400);
      }
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        await transaction.commit();
        transaction = null;
        return this.handleError(next, 'Invalid credentials', 400);
      }
      if (!admin.isActive) {
        await transaction.commit();
        transaction = null;
        return this.handleError(next, 'Your account is inactive', 400);
      }
      const accessToken = this.generateToken(admin.id, this.userTypes.admin, '1h');
      const refreshToken = await this.generateRefreshToken(admin.id, transaction);
      await transaction.commit();
      transaction = null;
      return res.status(200).json({
        error: false,
        message: 'Admin login successful',
        accessToken,
        refreshToken,
        user: {
          username: admin.username,
          email: admin.email,
        },
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<object>} Response with new access and refresh tokens
   */
  async refreshToken(req, res, next) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return this.handleError(next, 'Refresh token is required', 400);
    }

    let transaction;
    try {
      transaction = await sequelize.transaction();
      const tokenDoc = await this.verifyRefreshToken(refreshToken, transaction);

      if (!tokenDoc) {
        await transaction.commit();
        return this.handleError(next, 'Invalid or expired refresh token', 401);
      }
      const admin = await User.findOne({
        where: {
          id: tokenDoc.userId,
          roleId: this.userTypes.admin,
          isActive: true,
        },
        transaction,
      });

      if (!admin) {
        await transaction.commit();
        return this.handleError(next, 'User not found or not an admin', 401);
      }
      await this.revokeRefreshToken(refreshToken, transaction);
      const accessToken = this.generateToken(admin.id, this.userTypes.admin, '1h');
      const newRefreshToken = await this.generateRefreshToken(admin.id, transaction);
      await transaction.commit();
      return res.status(200).json({
        error: false,
        message: 'Token refreshed successfully',
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Logout admin user
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<object>} Response with logout status
   */
  async logout(req, res, next) {
    const { refreshToken } = req.body;

    let transaction;
    try {
      transaction = await sequelize.transaction();

      if (refreshToken) {
        await this.revokeRefreshToken(refreshToken, transaction);
      } else if (req.user && req.user.id) {
        await this.revokeAllUserRefreshTokens(req.user.id, transaction);
      }
      await transaction.commit();
      return res.status(200).json({
        error: false,
        message: 'Logged out successfully',
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }
}

module.exports = new AdminAuthController();
