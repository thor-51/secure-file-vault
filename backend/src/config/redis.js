// FILE: backend/src/config/redis.js
// Redis client using ioredis. Supports Upstash (TLS) and local Redis.

const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let client;

function getRedisClient() {
  if (client) return client;

  client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) {
        logger.error('Redis: max retry attempts reached');
        return null; // stop retrying
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error('Redis error:', err.message));
  client.on('close', () => logger.warn('Redis connection closed'));

  return client;
}

module.exports = { getRedisClient };
