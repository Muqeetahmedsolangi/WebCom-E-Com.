const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const BaseController = require('../controllers/BaseController');

const baseController = new BaseController();

const isAdmin = async (req, res, next) => {
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
    if (decoded.type !== 1) {
      return res.status(403).json({
        error: true,
        message: 'Access denied. Admin only',
      });
    }
    const admin = await User.findOne({
      where: {
        id: decoded.id,
        roleId: 1,
      },
      include: [
        {
          model: Role,
          as: 'role',
        },
      ],
    });

    if (!admin) {
      return res.status(403).json({
        error: true,
        message: 'Access denied. Admin only',
      });
    }
    if (!admin.isActive) {
      return res.status(403).json({
        error: true,
        message: 'Account is locked or inactive',
      });
    }
    req.user = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      error: true,
      message: 'Token is not valid',
    });
  }
};

module.exports = isAdmin;
