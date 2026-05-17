// FILE: backend/src/routes/file.routes.js
// File management routes

const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const uploadMiddleware = require('../middlewares/upload');
const { rateLimitUpload } = require('../middlewares/rateLimiter');
const { renameFileSchema, shareFileSchema, fileSearchSchema } = require('../validators/file.validator');

// All file routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /files/upload:
 *   post:
 *     summary: Upload a file to the vault
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: JSON array of tag IDs
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */
router.post('/upload', rateLimitUpload, uploadMiddleware, fileController.upload);

/**
 * @swagger
 * /files/search:
 *   get:
 *     summary: Search and filter files
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 */
router.get('/search', validate(fileSearchSchema), fileController.search);

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     summary: Get file metadata
 *     tags: [Files]
 */
router.get('/:id', fileController.getFile);

/**
 * @swagger
 * /files/{id}/download:
 *   get:
 *     summary: Get pre-signed download URL for a file
 *     tags: [Files]
 */
router.get('/:id/download', fileController.download);

/**
 * @swagger
 * /files/{id}/rename:
 *   patch:
 *     summary: Rename a file
 *     tags: [Files]
 */
router.patch('/:id/rename', validate(renameFileSchema), fileController.rename);

/**
 * @swagger
 * /files/{id}/share:
 *   post:
 *     summary: Update file sharing settings
 *     tags: [Files]
 */
router.post('/:id/share', validate(shareFileSchema), fileController.share);

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 */
router.delete('/:id', fileController.deleteFile);

module.exports = router;
