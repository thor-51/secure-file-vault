// FILE: backend/src/middlewares/upload.js
// Multer configuration: in-memory storage, MIME type + size validation

const multer = require('multer');
const env = require('../config/env');
const { ALLOWED_MIME_TYPES } = require('../validators/file.validator');
const { AppError } = require('../utils/errors');

const MAX_SIZE_BYTES = env.MAX_FILE_SIZE_MB * 1024 * 1024;

const storage = multer.memoryStorage(); // Hold file in memory for SHA-256 before S3 upload

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new AppError(
        `File type '${file.mimetype}' is not allowed`,
        415,
        'UNSUPPORTED_MIME_TYPE'
      ),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_BYTES,
    files: 1, // Single file per request
  },
});

// Wrap multer errors in AppError
const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError(`File too large. Max size: ${env.MAX_FILE_SIZE_MB}MB`, 413, 'FILE_TOO_LARGE')
        );
      }
      return next(new AppError(err.message, 400, 'UPLOAD_ERROR'));
    }
    if (err) return next(err);
    next();
  });
};

module.exports = uploadMiddleware;
