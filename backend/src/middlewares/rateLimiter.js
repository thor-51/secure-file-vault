// FILE: backend/src/middlewares/rateLimiter.js
// Redis-backed rate limiting using rate-limiter-flexible.
// Enforces 2 req/s per authenticated user; stricter limit on uploads.

const { RateLimiterRedis } = require('rate-limiter-flexible');
const { getRedisClient } = require('../config/redis');
const env = require('../config/env');
const { AppError } = require('../utils/errors');

let apiLimiter;
let uploadLimiter;

function getApiLimiter() {
  if (apiLimiter) return apiLimiter;
  apiLimiter = new RateLimiterRedis({
    storeClient: getRedisClient(),
    keyPrefix: 'rl_api',
    points: env.RATE_LIMIT_MAX_REQUESTS,  // requests
    duration: 1,                           // per 1 second
    blockDuration: 2,                      // block 2s after limit
  });
  return apiLimiter;
}

function getUploadLimiter() {
  if (uploadLimiter) return uploadLimiter;
  uploadLimiter = new RateLimiterRedis({
    storeClient: getRedisClient(),
    keyPrefix: 'rl_upload',
    points: 5,     // 5 uploads
    duration: 60,  // per minute
    blockDuration: 60,
  });
  return uploadLimiter;
}

/**
 * General API rate limiter — 2 req/s per user (or IP for unauthenticated)
 */
const rateLimitApi = async (req, res, next) => {
  const key = req.user?.id || req.ip;
  try {
    await getApiLimiter().consume(key);
    next();
  } catch (err) {
    const retryAfter = Math.ceil(err.msBeforeNext / 1000) || 1;
    res.set('Retry-After', retryAfter);
    next(new AppError(`Rate limit exceeded. Retry after ${retryAfter}s`, 429, 'RATE_LIMITED'));
  }
};

/**
 * Upload-specific throttle — 5 uploads/minute per user
 */
const rateLimitUpload = async (req, res, next) => {
  const key = req.user?.id || req.ip;
  try {
    await getUploadLimiter().consume(key);
    next();
  } catch (err) {
    const retryAfter = Math.ceil(err.msBeforeNext / 1000) || 60;
    res.set('Retry-After', retryAfter);
    next(new AppError(`Upload rate limit exceeded. Retry after ${retryAfter}s`, 429, 'RATE_LIMITED'));
  }
};

module.exports = { rateLimitApi, rateLimitUpload };
