// FILE: backend/src/tests/unit/auth.service.test.js
// Unit tests for AuthService with mocked repository

jest.mock('../../repositories/auth.repository');
const authRepository = require('../../repositories/auth.repository');
const authService = require('../../services/auth.service');
const bcrypt = require('bcrypt');

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Register ────────────────────────────────────────

  describe('register()', () => {
    it('should hash password and create user', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.createUser.mockResolvedValue({
        id: 'user-1', email: 'test@example.com', name: 'Test', role: 'user',
      });

      const user = await authService.register({
        name: 'Test', email: 'test@example.com', password: 'Pass@1234',
      });

      expect(authRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' })
      );
      expect(user.email).toBe('test@example.com');
    });

    it('should throw if email already exists', async () => {
      authRepository.findUserByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({ name: 'T', email: 'existing@example.com', password: 'P@ss1234' })
      ).rejects.toMatchObject({ code: 'EMAIL_EXISTS', statusCode: 409 });
    });
  });

  // ── Login ───────────────────────────────────────────

  describe('login()', () => {
    it('should return tokens on valid credentials', async () => {
      const hash = await bcrypt.hash('ValidPass@1', 10);
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u1', email: 'test@example.com', passwordHash: hash,
        name: 'Test', role: 'user', isActive: true,
        storageUsed: 0n, storageQuota: 10485760n,
      });
      authRepository.updateLastLogin.mockResolvedValue({});
      authRepository.createRefreshToken.mockResolvedValue({});

      const result = await authService.login({ email: 'test@example.com', password: 'ValidPass@1' });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw on wrong password', async () => {
      const hash = await bcrypt.hash('CorrectPass@1', 10);
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u1', passwordHash: hash, isActive: true,
      });

      await expect(
        authService.login({ email: 'test@example.com', password: 'WrongPass@1' })
      ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    });

    it('should throw on inactive account', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u1', passwordHash: 'x', isActive: false,
      });

      await expect(
        authService.login({ email: 'test@example.com', password: 'Any@Pass1' })
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });
});
