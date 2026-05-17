// FILE: backend/src/validators/file.validator.js
// Zod schemas for file-related request validation

const { z } = require('zod');

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'text/html',
  'application/json', 'application/xml',
  'application/zip', 'application/x-tar', 'application/gzip',
  'video/mp4', 'video/webm', 'video/ogg',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
];

const renameFileSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    name: z.string().min(1).max(255).trim(),
  }),
});

const shareFileSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    visibility: z.enum(['public', 'private', 'specific_users']),
    userIds: z.array(z.string().cuid()).optional(),
  }),
});

const fileSearchSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    mimeType: z.string().optional(),
    minSize: z.coerce.number().optional(),
    maxSize: z.coerce.number().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    tags: z.string().optional(), // comma-separated tag names
    ownerId: z.string().cuid().optional(),
    visibility: z.enum(['public', 'private', 'specific_users']).optional(),
    sortBy: z.enum(['name', 'size', 'createdAt', 'mimeType']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

module.exports = { renameFileSchema, shareFileSchema, fileSearchSchema, ALLOWED_MIME_TYPES };
