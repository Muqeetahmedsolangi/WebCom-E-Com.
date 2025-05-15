const { User, sequelize } = require('../../models');
const BaseController = require('../BaseController');
const UserAuthService = require('../../services/userAuthServices');

class UserAuthController extends BaseController {
  constructor() {
    super();
    this.signup = this.signup.bind(this);
    this.verifyOTP = this.verifyOTP.bind(this);
    this.resendOtp = this.resendOtp.bind(this);
    this.login = this.login.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.logout = this.logout.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.updateDetails = this.updateDetails.bind(this);
  }

  /**
   * Register a new user and generate OTP for verification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async signup(req, res, next) {
    const { username, email, password, phone } = req.body;

    if (!this.validateFields(req.body, ['username', 'email', 'password'])) {
      return this.handleError(next, 'Required fields missing', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();

      const existingUser = await UserAuthService.findUserByEmail(email, transaction);
      if (existingUser) {
        await transaction.rollback();
        return this.handleError(next, 'Email already in use', 400);
      }

      const user = await UserAuthService.createUser(
        {
          username,
          email,
          password,
          phone,
          roleId: this.userTypes.user,
          isActive: false, // Set to false initially until OTP verification
        },
        transaction,
      );

      const accessToken = this.generateToken(user.id, this.userTypes.user, '1h');
      const refreshToken = await this.generateRefreshToken(user.id, transaction);

      const otp = await this.createOtp(user.id, transaction, 5);
      await this.sendOtpEmail(email, otp, username);

      await transaction.commit();

      return res.status(201).json({
        error: false,
        message: 'Registration successful. Verification OTP sent to your email',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isActive: false,
        },
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Verify user account using OTP
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async verifyOTP(req, res, next) {
    console.log('req.body', req.body);
    const { otp } = req.body;
    const { id: userId } = req.user;

    if (!otp) {
      return this.handleError(next, 'OTP is required', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();

      const isValid = await this.verifyOtp(userId, otp, transaction);
      if (!isValid) {
        await transaction.rollback();
        return this.handleError(next, 'Invalid or expired OTP', 400);
      }

      // Update isActive to true
      await UserAuthService.updateUser(userId, { isActive: true }, transaction);

      const accessToken = this.generateToken(userId, this.userTypes.user, '1h');
      const refreshToken = await this.generateRefreshToken(userId, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'OTP verification successful. Your account is now active.',
        accessToken, // Send the new access token
        refreshToken, // Send the new refresh token
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          isActive: true,
        },
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Resend OTP to user's email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async resendOtp(req, res, next) {
    const { id: userId } = req.user;

    let transaction;
    try {
      transaction = await this.beginTransaction();

      const timeRemaining = await UserAuthService.getOtpTimeRemaining(userId, transaction);

      if (timeRemaining > 30) {
        // If more than 30 seconds remaining
        await transaction.rollback();
        return res.status(400).json({
          error: true,
          message: `Please wait ${Math.ceil(timeRemaining / 60)} minute(s) before requesting a new OTP`,
          secondsRemaining: `${timeRemaining} seconds remaining`,
        });
      }

      await UserAuthService.invalidateAllOtps(userId, transaction);
      const otp = await this.createOtp(userId, transaction, 5);
      await this.sendOtpEmail(req.user.email, otp, req.user.username);
      await transaction.commit();
      return res.status(200).json({
        error: false,
        message: 'New OTP sent to your email',
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * User login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async login(req, res, next) {
    const { email, password } = req.body;

    if (!this.validateFields(req.body, ['email', 'password'])) {
      return this.handleError(next, 'Email and password required', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();

      const user = await UserAuthService.findUserByEmail(email, transaction);
      if (!user) {
        await transaction.rollback();
        return this.handleError(next, 'Invalid credentials', 400);
      }

      const isPasswordValid = await UserAuthService.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        await transaction.rollback();
        return this.handleError(next, 'Invalid credentials', 400);
      }

      // Check if user account is active
      if (!user.isActive) {
        // Generate a new OTP for unverified accounts
        const otp = await this.createOtp(user.id, transaction, 5);
        await this.sendOtpEmail(user.email, otp, user.username);

        const accessToken = this.generateToken(user.id, this.userTypes.user, '1h');
        const refreshToken = await this.generateRefreshToken(user.id, transaction);

        await transaction.commit();

        return res.status(200).json({
          error: false,
          message: 'Account not activated. A verification OTP has been sent to your email.',
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            isActive: false,
          },
          requireVerification: true,
        });
      }

      const accessToken = this.generateToken(user.id, this.userTypes.user, '1h');
      const refreshToken = await this.generateRefreshToken(user.id, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Initiate password reset by sending token via email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async forgotPassword(req, res, next) {
    const { email } = req.body;

    if (!email) {
      return this.handleError(next, 'Email is required', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();
      const user = await UserAuthService.findUserByEmail(email, transaction);
      if (!user) {
        await transaction.rollback();
        return res.status(200).json({
          error: false,
          message: 'If your email exists in our system, you will receive a password reset link',
        });
      }
      const resetToken = this.generatePasswordResetToken(user.id, user.email, '15m');
      await this.sendPasswordResetEmail(email, resetToken, user.username);
      await transaction.commit();
      return res.status(200).json({
        error: false,
        message: 'If your email exists in our system, you will receive a password reset link',
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Reset password using token from email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async resetPassword(req, res, next) {
    const { token, newPassword } = req.body;

    if (!this.validateFields(req.body, ['token', 'newPassword'])) {
      return this.handleError(next, 'Token and new password required', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();

      // Verify reset token
      let decoded;
      try {
        decoded = this.verifyToken(token);
        if (decoded.type !== 'password_reset') {
          throw new Error('Invalid token type');
        }
      } catch (error) {
        await transaction.rollback();
        return this.handleError(next, 'Invalid or expired token', 400);
      }

      // Find user
      const user = await UserAuthService.findUserById(decoded.userId, transaction);
      if (!user || user.email !== decoded.email) {
        await transaction.rollback();
        return this.handleError(next, 'Invalid token', 400);
      }

      // Update password
      await UserAuthService.updateUser(decoded.userId, { password: newPassword }, transaction);

      // Revoke all refresh tokens
      await this.revokeAllUserRefreshTokens(decoded.userId, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Password reset successful',
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Log user out by revoking refresh tokens
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async logout(req, res, next) {
    const { refreshToken } = req.body;
    const { id } = req.user;

    let transaction;
    try {
      transaction = await this.beginTransaction();

      if (refreshToken) {
        await this.revokeRefreshToken(refreshToken, transaction);
      } else {
        await this.revokeAllUserRefreshTokens(id, transaction);
      }

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Logout successful',
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async refreshToken(req, res, next) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return this.handleError(next, 'Refresh token required', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();

      // Verify refresh token
      const tokenDoc = await this.verifyRefreshToken(refreshToken, transaction);
      if (!tokenDoc) {
        await transaction.rollback();
        return this.handleError(next, 'Invalid or expired refresh token', 401);
      }

      // Get user
      const user = await UserAuthService.findUserById(tokenDoc.userId, transaction);
      if (!user || user.roleId !== this.userTypes.user || !user.isActive) {
        await transaction.rollback();
        return this.handleError(next, 'User not found or inactive', 401);
      }

      // Revoke used token and generate new ones
      await this.revokeRefreshToken(refreshToken, transaction);
      const accessToken = this.generateToken(user.id, this.userTypes.user, '1h');
      const newRefreshToken = await this.generateRefreshToken(user.id, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Token refreshed',
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Update user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async updatePassword(req, res, next) {
    const { currentPassword, newPassword } = req.body;
    const { id } = req.user;

    if (!this.validateFields(req.body, ['currentPassword', 'newPassword'])) {
      return this.handleError(next, 'Current and new password required', 400);
    }

    // isActive already checked in isUser middleware

    let transaction;
    try {
      transaction = await this.beginTransaction();

      // Verify current password
      const isPasswordValid = await UserAuthService.verifyPassword(currentPassword, req.user.password);
      if (!isPasswordValid) {
        await transaction.rollback();
        return this.handleError(next, 'Current password is incorrect', 400);
      }

      // Update password
      await UserAuthService.updateUser(id, { password: newPassword }, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Password updated successfully',
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }

  /**
   * Update user profile details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async updateDetails(req, res, next) {
    const { username, phone } = req.body;
    const { id } = req.user;

    if (!username && !phone) {
      return this.handleError(next, 'No fields to update', 400);
    }

    let transaction;
    try {
      transaction = await this.beginTransaction();

      const updates = {};
      if (username) updates.username = username;
      if (phone) updates.phone = phone;

      const updatedUser = await UserAuthService.updateUser(id, updates, transaction);

      await transaction.commit();

      return res.status(200).json({
        error: false,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          phone: updatedUser.phone,
        },
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      return this.handleError(next, error.message, 500);
    }
  }
}

module.exports = new UserAuthController();
