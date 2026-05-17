// FILE: backend/src/config/database.js
// Prisma client singleton — prevents multiple instances during dev hot-reload

const { PrismaClient } = require('@prisma/client');
const env = require('./env');
const logger = require('../utils/logger');

const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

if (env.NODE_ENV === 'development') {
  // Log slow queries (>200ms)
  prisma.$on('query', (e) => {
    if (e.duration > 200) {
      logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
  global.__prisma = prisma;
}

prisma.$on('error', (e) => {
  logger.error('Prisma error:', e);
});

module.exports = prisma;
