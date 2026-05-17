// FILE: backend/src/routes/admin.routes.js
// Admin-only routes (require admin role)

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get system-wide statistics
 *     tags: [Admin]
 */
router.get('/stats', adminController.getStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users with analytics
 *     tags: [Admin]
 */
router.get('/users', adminController.listUsers);

/**
 * @swagger
 * /admin/users/{id}/toggle-status:
 *   patch:
 *     summary: Activate or deactivate a user account
 *     tags: [Admin]
 */
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Admin]
 */
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
