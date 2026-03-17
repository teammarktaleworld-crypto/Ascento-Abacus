'use strict';

const authService = require('./auth.service');
const ApiResponse = require('../core/ApiResponse');
const asyncHandler = require('../core/asyncHandler');
const AppError = require('../core/AppError');

// ─── POST /api/auth/login ────────────────────────────────────────────────────

/**
 * Login with identifier (email/userId) + password + role.
 *
 * Body: { identifier|email|userId, password, role }
 * Role must be one of: admin | teacher | student | parent
 */
const login = asyncHandler(async (req, res) => {
  const { email, userId, identifier, password, role } = req.body;
  const loginIdentifier = identifier || email || userId;

  if (!loginIdentifier || !password || !role) {
    throw new AppError('identifier (or email/userId), password, and role are required.', 400);
  }

  const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;
  const userAgent = req.headers['user-agent'] || null;

  const result = await authService.login(
    { identifier: loginIdentifier, password, role },
    { ipAddress, userAgent },
  );

  return new ApiResponse(200, 'Login successful', result).send(res);
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────

/**
 * Logout the current session.
 * Requires: x-session-key header (validated by validateSession middleware).
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.sessionKey);
  return new ApiResponse(200, 'Logged out successfully').send(res);
});

// ─── POST /api/auth/logout-all ───────────────────────────────────────────────

/**
 * Invalidate ALL active sessions for the current user.
 * Requires: x-session-key header.
 */
const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user._id, req.user.role);
  return new ApiResponse(200, 'All sessions terminated').send(res);
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────

/**
 * Return the currently authenticated user's profile.
 * Requires: x-session-key header.
 */
const getMe = asyncHandler(async (req, res) => {
  return new ApiResponse(200, 'Authenticated user', req.user).send(res);
});

module.exports = { login, logout, logoutAll, getMe };
