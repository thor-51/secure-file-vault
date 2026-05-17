// FILE: backend/src/utils/response.js
// Standardized API response helpers — keeps controller code clean

/**
 * Send a successful response
 * @param {Response} res - Express response object
 * @param {*} data - Response payload
 * @param {string} [message] - Optional message
 * @param {number} [statusCode=200] - HTTP status code
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a paginated response
 */
const sendPaginated = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination,
  });
};

/**
 * Send an error response
 */
const sendError = (res, message, statusCode = 500, code = 'INTERNAL_ERROR') => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    code,
  });
};

module.exports = { sendSuccess, sendPaginated, sendError };
