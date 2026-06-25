// FILE: backend/src/utils/response.js
// Standardized API response helpers — keeps controller code clean

// Convert BigInt fields to numbers recursively (Prisma returns BigInt for storage fields)
const serializeBigInt = (obj) => {
  return JSON.parse(JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? Number(value) : value
  ));
};

const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data ? serializeBigInt(data) : data,
  });
};

const sendPaginated = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data: serializeBigInt(data),
    pagination,
  });
};

const sendError = (res, message, statusCode = 500, code = 'INTERNAL_ERROR') => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    code,
  });
};

module.exports = { sendSuccess, sendPaginated, sendError };
