// FILE: backend/src/services/auth.service.js
// Business logic layer for authentication — JWT, bcrypt, token management

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const authRepository = require('../repositories/auth.repository');
const { AppError } = require('../utils/errors');

const BCRYPT_ROUNDS = 12;

const authService = {
  // ── Register ────────────────────────────────────────

  async register({ name, email, password }) {
    const existing = await authRepository.findUserByEmail(email);
    if (existing) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await authRepository.createUser({ name, email, passwordHash });
    return user;
  },

  // ── Login ───────────────────────────────────────────

  async login({ email, password }) {
    const user = await authRepository.findUserByEmail(email);
    if (!user || !user.isActive) {
      // Use same error to prevent user enumeration
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    await authRepository.updateLastLogin(user.id);

    const accessToken = this._signAccessToken(user);
    const { token: refreshToken, expiresAt } = await this._createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storageUsed: user.storageUsed,
        storageQuota: user.storageQuota,
      },
    };
  },

  // ── Refresh Access Token ─────────────────────────────

  async refreshToken(token) {
    const stored = await authRepository.findRefreshToken(token);

    if (!stored || stored.revokedAt || new Date() > stored.expiresAt) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    if (!stored.user.isActive) {
      throw new AppError('Account deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    // Rotate: revoke old token, issue new pair
    await authRepository.revokeRefreshToken(token);
    const accessToken = this._signAccessToken(stored.user);
    const { token: newRefreshToken } = await this._createRefreshToken(stored.user.id);

    return { accessToken, refreshToken: newRefreshToken };
  },

  // ── Logout ──────────────────────────────────────────

  async logout(refreshToken) {
    if (refreshToken) {
      await authRepository.revokeRefreshToken(refreshToken).catch(() => null);
    }
  },

  // ── Helpers ─────────────────────────────────────────

  _signAccessToken(user) {
    return jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  },

  async _createRefreshToken(userId) {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await authRepository.createRefreshToken({ token, userId, expiresAt });
    return { token, expiresAt };
  },
};

module.exports = authService;
