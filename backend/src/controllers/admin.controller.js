// FILE: backend/src/controllers/admin.controller.js
// Admin dashboard analytics controller

const fileRepository = require('../repositories/file.repository');
const prisma = require('../config/database');
const { asyncHandler } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

const adminController = {
  /**
   * GET /admin/stats — overall system statistics
   */
  getStats: asyncHandler(async (req, res) => {
    const [storageStats, fileStats, mimeBreakdown, recentActivity] = await Promise.all([
      fileRepository.getStorageStats(),
      fileRepository.getFileStats(),
      fileRepository.getMimeTypeBreakdown(),
      fileRepository.getUploadMetrics(30),
    ]);

    // Active users (logged in last 7 days)
    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    // Aggregate upload metrics by day
    const uploadsByDay = recentActivity.reduce((acc, file) => {
      const day = file.createdAt.toISOString().split('T')[0];
      if (!acc[day]) acc[day] = { count: 0, size: 0 };
      acc[day].count++;
      acc[day].size += Number(file.size);
      return acc;
    }, {});

    sendSuccess(res, {
      users: {
        total: storageStats._count.id,
        active: activeUsers,
        totalStorageUsed: storageStats._sum.storageUsed?.toString() || '0',
      },
      files: {
        total: fileStats._count.id,
        totalSize: fileStats._sum.size?.toString() || '0',
        mimeTypeBreakdown: mimeBreakdown.map((m) => ({
          mimeType: m.mimeType,
          count: m._count.id,
          totalSize: m._sum.size?.toString() || '0',
        })),
      },
      uploads: {
        byDay: Object.entries(uploadsByDay).map(([date, data]) => ({ date, ...data })),
      },
    });
  }),

  /**
   * GET /admin/users — list all users with storage usage
   */
  listUsers: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true, email: true, name: true, role: true,
          storageUsed: true, storageQuota: true, isActive: true,
          createdAt: true, lastLoginAt: true,
          _count: { select: { files: { where: { isDeleted: false } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    sendSuccess(res, {
      users: users.map((u) => ({ ...u, fileCount: u._count.files })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  }),

  /**
   * PATCH /admin/users/:id/deactivate
   */
  toggleUserStatus: asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, isActive: true },
    });

    sendSuccess(res, { user: updated });
  }),

  /**
   * GET /admin/audit-logs
   */
  getAuditLogs: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(req.query.userId && { userId: req.query.userId }),
      ...(req.query.action && { action: req.query.action }),
    };

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { email: true, name: true } },
          file: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    sendSuccess(res, {
      logs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  }),
};

module.exports = adminController;
