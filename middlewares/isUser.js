const { User, Role } = require('../models');
const BaseController = require('../controllers/BaseController');

const baseController = new BaseController();

const isUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: 'No token, authorization denied',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = baseController.verifyToken(token);

    if (decoded.type !== baseController.userTypes.user) {
      return res.status(403).json({
        error: true,
        message: 'Access denied. User only',
      });
    }

    const user = await User.findOne({
      where: {
        id: decoded.id,
        roleId: baseController.userTypes.user,
      },
      include: [
        {
          model: Role,
          as: 'role',
        },
      ],
    });

    if (!user) {
      return res.status(403).json({
        error: true,
        message: 'User not found',
      });
    }

    // We allow users to verify OTP even if inactive
    if (req.path === '/verify-otp' || req.path === '/resend-otp') {
      req.user = user;
      return next();
    }

    // For all other endpoints, check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        error: true,
        message: 'Your account is inactive. Please verify your email.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: true,
      message: 'Invalid token',
    });
  }
};

module.exports = isUser;
