// FILE: backend/src/middlewares/validate.js
// Generic Zod validation middleware factory.
// Validates req.body, req.params, and req.query against a Zod schema.

const { sendError } = require('../utils/response');

/**
 * @param {import('zod').ZodSchema} schema - Zod schema with { body?, params?, query? } shape
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const errors = result.error.flatten();
    return sendError(
      res,
      'Validation failed',
      422,
      'VALIDATION_ERROR'
    );
  }

  // Merge validated (and potentially coerced) values back into req
  if (result.data.body) req.body = result.data.body;
  if (result.data.params) req.params = result.data.params;
  if (result.data.query) req.query = result.data.query;

  next();
};

module.exports = validate;
