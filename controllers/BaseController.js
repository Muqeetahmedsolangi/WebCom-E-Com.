const jwt = require('jsonwebtoken');
const ErrorHandler = require('../utils/Error');
const crypto = require('crypto');
const { sendMail, EmailEnums, EmailTempletes } = require('../utils/sendMail');
const { RefreshToken, Otp, sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

class BaseController {
  constructor() {
    this.userTypes = {
      admin: 1,
      user: 2,
    };
  }

  /**
   * Generates a JWT token
   */
  generateToken(id, type, duration = '365d', validationCheck = false) {
    return jwt.sign(
      {
        id,
        type,
        validationCheck,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      {
        expiresIn: duration,
      },
    );
  }

  /**
   * Generates a special token for password reset
   */
  generatePasswordResetToken(userId, email, duration = '15m') {
    return jwt.sign(
      {
        userId,
        email,
        type: 'password_reset',
      },
      process.env.JWT_SECRET || 'your-secret-key',
      {
        expiresIn: duration,
      },
    );
  }

  /**
   * Verifies a JWT token
   */
  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  }

  /**
   * Generate refresh token and save to database
   */
  async generateRefreshToken(userId, transaction, expiryDays = 7) {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    await RefreshToken.create(
      {
        token: refreshToken,
        userId,
        expiresAt,
        isRevoked: false,
      },
      { transaction },
    );

    return refreshToken;
  }

  /**
   * Verify and validate a refresh token
   */
  async verifyRefreshToken(token, transaction) {
    const tokenDoc = await RefreshToken.findOne({
      where: {
        token,
        isRevoked: false,
      },
      transaction,
    });

    if (!tokenDoc || new Date() > tokenDoc.expiresAt) {
      return null;
    }

    return tokenDoc;
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(token, transaction) {
    const tokenDoc = await RefreshToken.findOne({
      where: { token },
      transaction,
    });

    if (!tokenDoc) return false;

    await tokenDoc.update({ isRevoked: true }, { transaction });
    return true;
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserRefreshTokens(userId, transaction) {
    const result = await RefreshToken.update(
      { isRevoked: true },
      {
        where: {
          userId,
          isRevoked: false,
        },
        transaction,
      },
    );

    return result[0];
  }

  /**
   * Creates a new OTP record in the database
   */
  async createOtp(userId, transaction, expiryMinutes = 5) {
    // Generate a 6-digit OTP using crypto for better randomness
    const buffer = crypto.randomBytes(3);
    const otp = String(parseInt(buffer.toString('hex'), 16) % 1000000).padStart(6, '0');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    await Otp.create(
      {
        userId,
        otp,
        expiresAt,
        isUsed: false,
      },
      { transaction },
    );

    return otp;
  }

  /**
   * Verifies an OTP for a user
   */
  async verifyOtp(userId, otp, transaction) {
    const otpRecord = await Otp.findOne({
      where: {
        userId,
        otp,
        isUsed: false,
      },
      order: [['createdAt', 'DESC']],
      transaction,
    });

    if (!otpRecord) return false;

    if (new Date() > otpRecord.expiresAt) {
      await otpRecord.update({ isUsed: true }, { transaction });
      return false;
    }

    await otpRecord.update({ isUsed: true }, { transaction });
    return true;
  }

  /**
   * Begins a new database transaction
   */
  async beginTransaction() {
    return await sequelize.transaction();
  }

  /**
   * Handles error by passing it to the next middleware
   */
  handleError(next, message, statusCode = 500) {
    next(new ErrorHandler(message, statusCode));
  }

  /**
   * Standard validation to check if required fields are missing
   */
  validateFields(fields, requiredFields) {
    for (const field of requiredFields) {
      if (!fields[field]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Sends an OTP via email
   */
  async sendOtpEmail(email, otp, username = '') {
    const name = username || email.split('@')[0];

    return await sendMail({
      email,
      subject: 'Your Verification Code',
      otp,
      template: EmailTempletes.otp,
      type: EmailEnums.otp,
      context: {
        name,
        otp,
      },
    });
  }

  /**
   * Sends a password reset email with token link
   */
  async sendPasswordResetEmail(email, resetToken, username = '') {
    const name = username || email.split('@')[0];

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    return await sendMail({
      email,
      subject: 'Reset Your Password',
      template: EmailTempletes.passwordReset,
      type: EmailEnums.passwordReset,
      context: {
        name,
        resetLink,
      },
    });
  }

  /**
   * Uploads a file to a local directory
   * @param {object} params - Parameters for uploading the file
   * @param {string} params.Key - The file path (including filename)
   * @param {Buffer|string} params.Body - The file content (Buffer or string)
   * @param {string} params.ContentType - The content type of the file (e.g., 'image/jpeg')
   * @returns {boolean} Returns true if the file is uploaded successfully, false otherwise
   */
  async uploadFile({ Key, Body }) {
    const localDir = path.join(process.cwd(), 'uploads');

    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    const filePath = path.join(localDir, Key);
    const fileDir = path.dirname(filePath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    try {
      await fs.promises.writeFile(filePath, Body);
      console.log(`File uploaded successfully to ${filePath}`);
      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      return false;
    }
  }

  /**
   * Constructs a file upload path based on the given directory and file name.
   *
   * @param {string} path - The directory path where the file will be uploaded.
   *                        This can be an empty string, or a subdirectory (e.g., 'banners/').
   * @param {string} name - The name of the file to be uploaded, including its extension (e.g., 'image.jpg').
   * @returns {string} The complete upload path in the format 'uploads/{path}{name}',
   *                  which can be used for storing files in an S3 bucket or local storage.
   *
   * @example
   * // Returns 'uploads/banners/image.jpg'
   * createPath('banners/', 'image.jpg');
   *
   * // Returns 'uploads/image.png'
   * createPath('', 'image.png');
   */
  createPath(path = '', name) {
    const newName = `${Date.now()}-${name.replaceAll(' ', '-')}`;

    return `${path}${newName}`;
  }
}

module.exports = BaseController;
