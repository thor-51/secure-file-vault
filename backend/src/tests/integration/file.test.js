// FILE: backend/src/tests/integration/file.test.js
// Integration tests for file management (upload, download, delete, search)

const request = require('supertest');
const path = require('path');
const crypto = require('crypto');
const app = require('../../app');
const prisma = require('../../config/database');

// Mock S3 service so tests don't need real AWS credentials
jest.mock('../../services/s3.service', () => ({
  upload: jest.fn().mockResolvedValue('test-s3-key'),
  getSignedDownloadUrl: jest.fn().mockResolvedValue('https://s3.example.com/test-file?signed=1'),
  delete: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  buildKey: jest.fn((userId, hash, name) => `uploads/${userId}/${hash}.${name.split('.').pop()}`),
}));

describe('File API', () => {
  let accessToken;
  let userId;
  let fileId;

  const testUser = {
    name: 'File Test User',
    email: `filetest-${Date.now()}@example.com`,
    password: 'TestPass@123',
  };

  // ── Setup ────────────────────────────────────────────

  beforeAll(async () => {
    // Register and login
    await request(app).post('/api/v1/auth/register').send(testUser);
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    accessToken = loginRes.body.data.accessToken;
    userId = loginRes.body.data.user.id;
  });

  // ── Upload ───────────────────────────────────────────

  describe('POST /api/v1/files/upload', () => {
    it('should upload a text file', async () => {
      const res = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('Hello, Vault!'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.file.name).toBe('test.txt');
      fileId = res.body.data.file.id;
    });

    it('should reject upload without authentication', async () => {
      await request(app)
        .post('/api/v1/files/upload')
        .attach('file', Buffer.from('test'), { filename: 'test.txt', contentType: 'text/plain' })
        .expect(401);
    });

    it('should reject disallowed MIME type', async () => {
      const res = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('<exe/>'), {
          filename: 'malware.exe',
          contentType: 'application/x-msdownload',
        })
        .expect(415);

      expect(res.body.code).toBe('UNSUPPORTED_MIME_TYPE');
    });

    it('should prevent duplicate file upload', async () => {
      const res = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('Hello, Vault!'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        })
        .expect(409);

      expect(res.body.code).toBe('DUPLICATE_FILE');
    });
  });

  // ── Get file ─────────────────────────────────────────

  describe('GET /api/v1/files/:id', () => {
    it('should return file metadata', async () => {
      const res = await request(app)
        .get(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.file.id).toBe(fileId);
    });

    it('should return 404 for non-existent file', async () => {
      await request(app)
        .get('/api/v1/files/nonexistentid00000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  // ── Download ─────────────────────────────────────────

  describe('GET /api/v1/files/:id/download', () => {
    it('should return a presigned URL', async () => {
      const res = await request(app)
        .get(`/api/v1/files/${fileId}/download`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.url).toContain('https://');
    });
  });

  // ── Rename ───────────────────────────────────────────

  describe('PATCH /api/v1/files/:id/rename', () => {
    it('should rename a file', async () => {
      const res = await request(app)
        .patch(`/api/v1/files/${fileId}/rename`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'renamed.txt' })
        .expect(200);

      expect(res.body.data.file.name).toBe('renamed.txt');
    });
  });

  // ── Share ────────────────────────────────────────────

  describe('POST /api/v1/files/:id/share', () => {
    it('should make a file public', async () => {
      const res = await request(app)
        .post(`/api/v1/files/${fileId}/share`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ visibility: 'public' })
        .expect(200);

      expect(res.body.data.file.visibility).toBe('public');
    });
  });

  // ── Search ───────────────────────────────────────────

  describe('GET /api/v1/files/search', () => {
    it('should return paginated results', async () => {
      const res = await request(app)
        .get('/api/v1/files/search?q=renamed&page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
    });
  });

  // ── Delete ───────────────────────────────────────────

  describe('DELETE /api/v1/files/:id', () => {
    it('should delete the file', async () => {
      await request(app)
        .delete(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should return 404 after deletion', async () => {
      await request(app)
        .get(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  // ── Cleanup ─────────────────────────────────────────

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });
});
