// FILE: backend/src/controllers/auth.controller.js
// HTTP layer for authentication — delegates to authService

const authService = require('../services/auth.service');
const { asyncHandler } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { logAudit } = require('../middlewares/auditLogger');

const authController = {
  /**
   * POST /auth/register
   */
  register: asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);

    logAudit({
      userId: user.id,
      action: 'REGISTER',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendSuccess(res, { user }, 'Registration successful', 201);
  }),

  /**
   * POST /auth/login
   */
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);

    logAudit({
      userId: result.user.id,
      action: 'LOGIN',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendSuccess(res, result, 'Login successful');
  }),

  /**
   * POST /auth/refresh
   */
  refresh: asyncHandler(async (req, res) => {
    const tokens = await authService.refreshToken(req.body.refreshToken);
    sendSuccess(res, tokens, 'Token refreshed');
  }),

  /**
   * POST /auth/logout
   */
  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);

    logAudit({
      userId: req.user?.id,
      action: 'LOGOUT',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendSuccess(res, null, 'Logged out successfully');
  }),

  /**
   * GET /auth/me
   */
  getMe: asyncHandler(async (req, res) => {
    const { passwordHash: _, ...user } = req.user;
    sendSuccess(res, { user });
  }),
};

module.exports = authController;
