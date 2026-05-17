// FILE: backend/src/utils/errors.js
// Custom error class and async route handler wrapper

/**
 * AppError — operational error with HTTP status and machine-readable code.
 * Allows centralized error middleware to distinguish expected vs unexpected errors.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // distinguish from programmer errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wraps an async route handler, automatically forwarding errors to Express error middleware.
 * Eliminates try/catch boilerplate in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, asyncHandler };
