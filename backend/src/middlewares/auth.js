// FILE: backend/src/middlewares/auth.js
// JWT authentication + role-based authorization middleware

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/database');
const { AppError } = require('../utils/errors');

/**
 * authenticate — verifies JWT from Authorization header.
 * Attaches req.user (full DB record) on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    // Fetch fresh user from DB to pick up role changes / deactivations
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        storageUsed: true,
        storageQuota: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated', 401, 'UNAUTHORIZED');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * authorize — role guard. Must be used after authenticate.
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'user')
 */
const authorize = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    next();
  };

module.exports = { authenticate, authorize };
