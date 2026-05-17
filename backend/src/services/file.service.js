// FILE: backend/src/services/file.service.js
// File business logic: upload with dedup, download, delete, search, permissions

const crypto = require('crypto');
const env = require('../config/env');
const fileRepository = require('../repositories/file.repository');
const s3Service = require('./s3.service');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const QUOTA_BYTES = env.DEFAULT_STORAGE_QUOTA_MB * 1024 * 1024;

const fileService = {
  // ── Upload ────────────────────────────────────────────────────────

  async upload({ buffer, originalName, mimeType, ownerId, description, tags }) {
    // 1. Check storage quota
    const { prisma } = require('../config/database'); // lazy to avoid circular
    const user = await require('../repositories/auth.repository').findUserById(ownerId);
    const quota = Number(user.storageQuota);
    const used = Number(user.storageUsed);

    if (used + buffer.length > quota) {
      throw new AppError(
        `Storage quota exceeded. Available: ${((quota - used) / 1024 / 1024).toFixed(2)} MB`,
        413,
        'QUOTA_EXCEEDED'
      );
    }

    // 2. Compute SHA-256 for deduplication
    const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // 3. Check for duplicate (same file, same owner)
    const existing = await fileRepository.findByHash(sha256Hash, ownerId);
    if (existing) {
      throw new AppError(
        'This file already exists in your vault',
        409,
        'DUPLICATE_FILE'
      );
    }

    // 4. Build S3 key and upload (only if not already stored by another user)
    const s3Key = s3Service.buildKey(ownerId, sha256Hash, originalName);
    const alreadyInS3 = await s3Service.exists(s3Key);

    if (!alreadyInS3) {
      await s3Service.upload({ key: s3Key, buffer, mimeType });
    }

    // 5. Persist file metadata
    const file = await fileRepository.create({
      name: originalName,
      originalName,
      s3Key,
      s3Bucket: env.AWS_S3_BUCKET,
      mimeType,
      size: buffer.length,
      sha256Hash,
      ownerId,
      description,
      tags,
    });

    // 6. Update owner's storage counter
    await fileRepository.incrementStorage(ownerId, buffer.length);

    return file;
  },

  // ── Download (presigned URL) ───────────────────────────────────────

  async getDownloadUrl(fileId, requesterId) {
    const file = await fileRepository.findById(fileId);
    if (!file) throw new AppError('File not found', 404, 'NOT_FOUND');

    await this._assertReadAccess(file, requesterId);

    const url = await s3Service.getSignedDownloadUrl(file.s3Key);
    return { url, file };
  },

  // ── Delete ────────────────────────────────────────────────────────

  async deleteFile(fileId, requesterId, requesterRole) {
    const file = await fileRepository.findById(fileId);
    if (!file) throw new AppError('File not found', 404, 'NOT_FOUND');

    // Only owner or admin can delete
    if (file.ownerId !== requesterId && requesterRole !== 'admin') {
      throw new AppError('Cannot delete this file', 403, 'FORBIDDEN');
    }

    // Soft delete in DB
    await fileRepository.softDelete(fileId);

    // Check if S3 key is used by other files (dedup scenario — different users same content)
    // If no other file references same s3Key, delete from S3
    const otherRef = await fileRepository.findByS3Key(file.s3Key);
    if (!otherRef || otherRef.id === fileId) {
      await s3Service.delete(file.s3Key).catch(() => null);
    }

    // Decrement storage
    await fileRepository.decrementStorage(file.ownerId, Number(file.size));

    return true;
  },

  // ── Rename ────────────────────────────────────────────────────────

  async renameFile(fileId, newName, requesterId) {
    const file = await fileRepository.findById(fileId);
    if (!file) throw new AppError('File not found', 404, 'NOT_FOUND');
    if (file.ownerId !== requesterId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    return fileRepository.rename(fileId, newName);
  },

  // ── Share ─────────────────────────────────────────────────────────

  async shareFile(fileId, { visibility, userIds }, requesterId) {
    const file = await fileRepository.findById(fileId);
    if (!file) throw new AppError('File not found', 404, 'NOT_FOUND');
    if (file.ownerId !== requesterId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    await fileRepository.updateVisibility(fileId, visibility);

    // If sharing with specific users, upsert permissions
    if (visibility === 'specific_users' && userIds?.length) {
      await Promise.all(
        userIds.map((uid) =>
          fileRepository.upsertPermission(fileId, uid, { canRead: true, canDelete: false })
        )
      );
    }

    return fileRepository.findById(fileId);
  },

  // ── Search ────────────────────────────────────────────────────────

  async search(queryParams, requesterId, requesterRole) {
    const { page, limit, skip } = parsePagination(queryParams);
    const {
      q, mimeType, minSize, maxSize, dateFrom, dateTo,
      tags, ownerId, visibility, sortBy = 'createdAt', sortOrder = 'desc',
    } = queryParams;

    // Build Prisma where clause
    const where = {
      isDeleted: false,
      AND: [
        // Non-admin users can only see their own + public + shared-with-them
        requesterRole !== 'admin'
          ? {
              OR: [
                { ownerId: requesterId },
                { visibility: 'public' },
                { permissions: { some: { userId: requesterId, canRead: true } } },
              ],
            }
          : {},
        q ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        } : {},
        mimeType ? { mimeType: { contains: mimeType, mode: 'insensitive' } } : {},
        minSize ? { size: { gte: BigInt(minSize) } } : {},
        maxSize ? { size: { lte: BigInt(maxSize) } } : {},
        dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
        dateTo ? { createdAt: { lte: new Date(dateTo) } } : {},
        ownerId && requesterRole === 'admin' ? { ownerId } : {},
        visibility && requesterRole === 'admin' ? { visibility } : {},
        tags
          ? { tags: { some: { tag: { name: { in: tags.split(',').map((t) => t.trim()) } } } } }
          : {},
      ].filter((c) => Object.keys(c).length > 0),
    };

    const orderBy = { [sortBy]: sortOrder };
    const { files, total } = await fileRepository.search({ where, orderBy, skip, take: limit });

    return {
      files,
      pagination: buildPaginationMeta(total, page, limit),
    };
  },

  // ── Access control helper ─────────────────────────────────────────

  async _assertReadAccess(file, requesterId) {
    if (file.visibility === 'public') return;
    if (file.ownerId === requesterId) return;

    const perm = await fileRepository.findPermission(file.id, requesterId);
    if (!perm?.canRead) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
  },
};

module.exports = fileService;
