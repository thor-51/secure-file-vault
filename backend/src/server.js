// FILE: backend/src/server.js
// Server entry point — starts the HTTP server and manages graceful shutdown

require('dotenv').config();
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const prisma = require('./config/database');
const { getRedisClient } = require('./config/redis');

let server;

async function bootstrap() {
  // Connect Redis eagerly so it's ready before first request
  try {
    const redis = getRedisClient();
    await redis.connect().catch(() => {}); // ioredis auto-connects, catch double-connect
    logger.info('Redis client ready');
  } catch (err) {
    logger.warn('Redis not available — rate limiting may be degraded:', err.message);
  }

  server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`📡 API base: http://localhost:${env.PORT}/api/${env.API_VERSION}`);
  });

  server.on('error', (err) => {
    logger.error('Server error:', err);
    process.exit(1);
  });
}

// ── Graceful shutdown ───────────────────────────────────────────────

async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);

  server?.close(async () => {
    logger.info('HTTP server closed');

    await prisma.$disconnect().catch(() => null);
    logger.info('Database disconnected');

    const redis = getRedisClient();
    await redis.quit().catch(() => null);
    logger.info('Redis disconnected');

    process.exit(0);
  });

  // Force exit if shutdown takes too long
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});

bootstrap();
