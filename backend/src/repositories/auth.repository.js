// FILE: backend/src/repositories/auth.repository.js
// Data access layer for authentication — isolates DB logic from service layer

const prisma = require('../config/database');

const authRepository = {
  async findUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findUserById(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  async createUser({ name, email, passwordHash }) {
    return prisma.user.create({
      data: { name, email, passwordHash },
      select: {
        id: true, email: true, name: true, role: true,
        storageUsed: true, storageQuota: true, createdAt: true,
      },
    });
  },

  async updateLastLogin(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  // ── Refresh Tokens ─────────────────────────────────

  async createRefreshToken({ token, userId, expiresAt }) {
    return prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  },

  async findRefreshToken(token) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  async revokeRefreshToken(token) {
    return prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllUserTokens(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async deleteExpiredTokens() {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};

module.exports = authRepository;
