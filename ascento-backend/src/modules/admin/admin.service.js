'use strict';

const AppError = require('../../core/AppError');
const authService = require('../../auth/auth.service');
const Admin = require('../../models/admin.model');
const env = require('../../config/env');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Return a plain admin object with the password field stripped.
 * @param {import('mongoose').Document} doc
 */
const sanitise = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.password;
  obj.role = 'admin';
  return obj;
};

// ─── Service methods ─────────────────────────────────────────────────────────

/**
 * Authenticate an admin and open a session.
 *
 * @param {{ email: string, password: string }} credentials
 * @param {{ ipAddress?: string, userAgent?: string }} meta
 * @returns {{ sessionKey: string, expiresAt: Date, adminProfile: object }}
 */
const login = async ({ email, password }, meta = {}) => {
  // Delegate to shared auth service — enforces role:'admin'
  const result = await authService.login({ email, password, role: 'admin' }, meta);

  return {
    sessionKey: result.sessionKey,
    expiresAt: result.expiresAt,
    adminProfile: result.user,   // already sanitised (no password) by authService
  };
};

/**
 * Invalidate the current session.
 * @param {string} sessionKey
 */
const logout = async (sessionKey) => {
  await authService.logout(sessionKey);
};

/**
 * Fetch the full admin profile (no password).
 * @param {string|import('mongoose').Types.ObjectId} adminId
 * @returns {object}
 */
const getProfile = async (adminId) => {
  const admin = await Admin.findById(adminId).select('-password');
  if (!admin) throw new AppError('Admin not found.', 404);
  return sanitise(admin);
};

/**
 * Change the admin's password after verifying the current one.
 *
 * @param {string|import('mongoose').Types.ObjectId} adminId
 * @param {{ currentPassword: string, newPassword: string }} payload
 */
const changePassword = async (adminId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw new AppError('currentPassword and newPassword are required.', 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from the current password.', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters.', 400);
  }

  // Fetch with password to verify
  const admin = await Admin.findById(adminId).select('+password');
  if (!admin) throw new AppError('Admin not found.', 404);

  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect.', 401);

  admin.password = newPassword;   // pre-save hook hashes it
  await admin.save();
};

module.exports = { login, logout, getProfile, changePassword };
