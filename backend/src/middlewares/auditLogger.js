// FILE: backend/src/middlewares/auditLogger.js
// Audit logging utility — records security-sensitive operations to the DB

const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Log an audit event asynchronously (non-blocking).
 * @param {object} opts
 * @param {string|null} opts.userId
 * @param {string|null} opts.fileId
 * @param {string} opts.action - AuditAction enum value
 * @param {string} opts.ipAddress
 * @param {string} opts.userAgent
 * @param {object} [opts.metadata]
 */
const logAudit = ({ userId, fileId, action, ipAddress, userAgent, metadata }) => {
  // Fire-and-forget — don't block request on audit write
  prisma.auditLog
    .create({
      data: {
        userId: userId || null,
        fileId: fileId || null,
        action,
        ipAddress,
        userAgent: userAgent?.substring(0, 255) || null,
        metadata: metadata || undefined,
      },
    })
    .catch((err) => logger.error('Audit log write failed:', err.message));
};

/**
 * Express middleware factory — logs an action after the response is sent.
 * @param {string} action - AuditAction enum value
 */
const auditMiddleware = (action) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 400) {
      logAudit({
        userId: req.user?.id,
        fileId: req.params?.id,
        action,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
  });
  next();
};

module.exports = { logAudit, auditMiddleware };
