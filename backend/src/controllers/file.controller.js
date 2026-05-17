// FILE: backend/src/controllers/file.controller.js
// HTTP layer for file operations

const fileService = require('../services/file.service');
const { asyncHandler } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { logAudit } = require('../middlewares/auditLogger');

const fileController = {
  /**
   * POST /files/upload
   * Accepts multipart form data (handled by multer in route)
   */
  upload: asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded', code: 'NO_FILE' });
    }

    const file = await fileService.upload({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      ownerId: req.user.id,
      description: req.body.description,
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
    });

    logAudit({
      userId: req.user.id,
      fileId: file.id,
      action: 'UPLOAD',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { fileName: file.name, size: Number(file.size) },
    });

    sendSuccess(res, { file }, 'File uploaded successfully', 201);
  }),

  /**
   * GET /files/:id/download
   */
  download: asyncHandler(async (req, res) => {
    const { url, file } = await fileService.getDownloadUrl(req.params.id, req.user.id);

    logAudit({
      userId: req.user.id,
      fileId: file.id,
      action: 'DOWNLOAD',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendSuccess(res, { url, file });
  }),

  /**
   * DELETE /files/:id
   */
  deleteFile: asyncHandler(async (req, res) => {
    await fileService.deleteFile(req.params.id, req.user.id, req.user.role);

    logAudit({
      userId: req.user.id,
      fileId: req.params.id,
      action: 'DELETE',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendSuccess(res, null, 'File deleted');
  }),

  /**
   * PATCH /files/:id/rename
   */
  rename: asyncHandler(async (req, res) => {
    const file = await fileService.renameFile(req.params.id, req.body.name, req.user.id);

    logAudit({
      userId: req.user.id,
      fileId: req.params.id,
      action: 'RENAME',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { newName: req.body.name },
    });

    sendSuccess(res, { file });
  }),

  /**
   * POST /files/:id/share
   */
  share: asyncHandler(async (req, res) => {
    const file = await fileService.shareFile(req.params.id, req.body, req.user.id);

    logAudit({
      userId: req.user.id,
      fileId: req.params.id,
      action: 'SHARE',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { visibility: req.body.visibility },
    });

    sendSuccess(res, { file });
  }),

  /**
   * GET /files/search
   */
  search: asyncHandler(async (req, res) => {
    const result = await fileService.search(req.query, req.user.id, req.user.role);
    sendPaginated(res, result.files, result.pagination);
  }),

  /**
   * GET /files/:id
   */
  getFile: asyncHandler(async (req, res) => {
    const fileRepository = require('../repositories/file.repository');
    const file = await fileRepository.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found', code: 'NOT_FOUND' });
    }
    sendSuccess(res, { file });
  }),
};

module.exports = fileController;
