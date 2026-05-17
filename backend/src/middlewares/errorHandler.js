// FILE: backend/src/middlewares/errorHandler.js
// Centralized Express error handler.
// Differentiates operational errors (AppError) from unexpected errors.

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const env = require('../config/env');

// Handle specific Prisma error codes
const handlePrismaError = (err) => {
  switch (err.code) {
    case 'P2002':
      return new AppError('A record with this value already exists', 409, 'DUPLICATE_ENTRY');
    case 'P2025':
      return new AppError('Record not found', 404, 'NOT_FOUND');
    case 'P2003':
      return new AppError('Referenced record does not exist', 400, 'FOREIGN_KEY_ERROR');
    default:
      return new AppError('Database error', 500, 'DB_ERROR');
  }
};

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Wrap known Prisma errors
  if (err.code?.startsWith('P')) {
    error = handlePrismaError(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  // Log non-operational (unexpected) errors with full stack
  if (!isOperational) {
    logger.error('Unexpected error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
    });
  } else {
    logger.warn('Operational error:', {
      message: err.message,
      code: err.code,
      statusCode,
      url: req.url,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: isOperational ? error.message : 'Something went wrong',
    code: error.code || 'INTERNAL_ERROR',
    // Include stack only in development
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
