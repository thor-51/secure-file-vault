// FILE: backend/src/repositories/file.repository.js
// Data access layer for files — Prisma queries for file CRUD, search, dedup

const prisma = require('../config/database');

const fileRepository = {
  // ── Find ────────────────────────────────────────────

  async findById(id) {
    return prisma.file.findFirst({
      where: { id, isDeleted: false },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
        permissions: { include: { user: { select: { id: true, email: true, name: true } } } },
      },
    });
  },

  async findByHash(sha256Hash, ownerId) {
    return prisma.file.findUnique({
      where: { dedup_key: { sha256Hash, ownerId } },
    });
  },

  async findByS3Key(s3Key) {
    return prisma.file.findFirst({ where: { s3Key, isDeleted: false } });
  },

  // ── Create ──────────────────────────────────────────

  async create({ name, originalName, s3Key, s3Bucket, mimeType, size, sha256Hash, ownerId, description, tags }) {
    return prisma.file.create({
      data: {
        name,
        originalName,
        s3Key,
        s3Bucket,
        mimeType,
        size,
        sha256Hash,
        ownerId,
        description,
        tags: tags?.length
          ? {
              create: tags.map((tagId) => ({ tag: { connect: { id: tagId } } })),
            }
          : undefined,
      },
      include: { tags: { include: { tag: true } } },
    });
  },

  // ── Update ──────────────────────────────────────────

  async rename(id, name) {
    return prisma.file.update({ where: { id }, data: { name } });
  },

  async updateVisibility(id, visibility) {
    return prisma.file.update({ where: { id }, data: { visibility } });
  },

  async softDelete(id) {
    return prisma.file.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },

  // ── Storage quota ───────────────────────────────────

  async incrementStorage(userId, bytes) {
    return prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { increment: bytes } },
    });
  },

  async decrementStorage(userId, bytes) {
    return prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { decrement: bytes } },
    });
  },

  // ── Permissions ─────────────────────────────────────

  async upsertPermission(fileId, userId, { canRead, canDelete }) {
    return prisma.filePermission.upsert({
      where: { fileId_userId: { fileId, userId } },
      create: { fileId, userId, canRead, canDelete },
      update: { canRead, canDelete },
    });
  },

  async deletePermission(fileId, userId) {
    return prisma.filePermission.deleteMany({ where: { fileId, userId } });
  },

  async findPermission(fileId, userId) {
    return prisma.filePermission.findUnique({
      where: { fileId_userId: { fileId, userId } },
    });
  },

  // ── Search (optimized with Prisma's where + orderBy) ──

  async search({ where, orderBy, skip, take }) {
    const [files, total] = await prisma.$transaction([
      prisma.file.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          tags: { include: { tag: true } },
        },
      }),
      prisma.file.count({ where }),
    ]);
    return { files, total };
  },

  // ── Admin stats ─────────────────────────────────────

  async getStorageStats() {
    return prisma.user.aggregate({
      _sum: { storageUsed: true },
      _count: { id: true },
    });
  },

  async getFileStats() {
    return prisma.file.aggregate({
      where: { isDeleted: false },
      _count: { id: true },
      _sum: { size: true },
    });
  },

  async getMimeTypeBreakdown() {
    return prisma.file.groupBy({
      by: ['mimeType'],
      where: { isDeleted: false },
      _count: { id: true },
      _sum: { size: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
  },

  async getUploadMetrics(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.file.findMany({
      where: { createdAt: { gte: since }, isDeleted: false },
      select: { createdAt: true, size: true },
      orderBy: { createdAt: 'asc' },
    });
  },
};

module.exports = fileRepository;
