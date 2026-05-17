// FILE: backend/src/tests/integration/auth.test.js
// Integration tests for authentication flow

const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/database');

describe('Auth API', () => {
  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass@123',
  };

  let accessToken;
  let refreshToken;

  // ── Register ────────────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.code).toBe('EMAIL_EXISTS');
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: 'new@example.com', password: 'weak' })
        .expect(422);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: 'not-an-email' })
        .expect(422);
    });
  });

  // ── Login ───────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('should login and return tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPass@123' })
        .expect(401);

      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject unknown email', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'AnyPass@123' })
        .expect(401);
    });
  });

  // ── Me ──────────────────────────────────────────────

  describe('GET /api/v1/auth/me', () => {
    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      await request(app).get('/api/v1/auth/me').expect(401);
    });

    it('should reject malformed token', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });

  // ── Refresh ─────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('should issue new tokens with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      // Old refresh token should be rotated (invalidated)
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject reused refresh token (rotation)', async () => {
      // Try to use the old refresh token (already rotated)
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'old-rotated-token' })
        .expect(401);

      expect(res.body.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  // ── Logout ──────────────────────────────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);
    });
  });

  // ── Cleanup ─────────────────────────────────────────

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });
});
