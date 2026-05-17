// FILE: backend/src/routes/health.routes.js
// System health check endpoint — used by load balancers and monitoring

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { getRedisClient } = require('../config/redis');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: System health check
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: System is healthy
 */
router.get('/', async (req, res) => {
  const checks = { api: 'ok', db: 'unknown', redis: 'unknown' };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = 'ok';
  } catch {
    checks.db = 'error';
  }

  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const healthy = Object.values(checks).every((v) => v === 'ok');
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(process.uptime()),
  });
});

module.exports = router;
