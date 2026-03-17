'use strict';

const { v4: uuidv4 } = require('uuid');
const AppError = require('../core/AppError');
const Session = require('../models/Session.model');
const env = require('../config/env');

// ─── Role → model mapping ────────────────────────────────────────────────────

const ROLE_CONFIG = {
  admin:   { getModel: () => require('../models/admin.model'),   userModel: 'Admin' },
  teacher: { getModel: () => require('../models/teacher.model'), userModel: 'Teacher' },
  student: { getModel: () => require('../models/student.model'), userModel: 'Student' },
  parent:  { getModel: () => require('../models/parent.model'),  userModel: 'Parent' },
};

const USER_MODEL_LOOKUP = {
  Admin: () => require('../models/admin.model'),
  Teacher: () => require('../models/teacher.model'),
  Student: () => require('../models/student.model'),
  Parent: () => require('../models/parent.model'),
};

const isUserActive = (user) => {
  if (typeof user.isActive === 'boolean') {
    return user.isActive;
  }

  if (typeof user.status === 'string') {
    return user.status === 'active';
  }

  return true;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parses a human-readable duration string (e.g. "7d", "15m", "2h") into
 * milliseconds. Falls back to 7 days if the string is unrecognised.
 *
 * @param {string} str  Duration string
 * @returns {number}    Duration in milliseconds
 */
const parseDurationMs = (str) => {
  const units = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = str && str.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 86_400_000; // default 7 days
  return parseInt(match[1], 10) * units[match[2]];
};

const buildLoginQuery = (role, identifier) => {
  const normalized = identifier.toLowerCase().trim();

  if (role === 'student') {
    return {
      $or: [
        { parentEmail: normalized },
        { email: normalized },
      ],
    };
  }

  if (role === 'teacher') {
    return {
      $or: [
        { email: normalized },
        { userId: identifier.trim() },
      ],
    };
  }

  return { email: normalized };
};

const clearSessionKeyForUser = async (userModel, userId) => {
  const modelFactory = USER_MODEL_LOOKUP[userModel];
  if (!modelFactory) {
    return;
  }

  const Model = modelFactory();
  const document = await Model.findById(userId).select('+sessionKey');
  if (document && 'sessionKey' in document) {
    document.sessionKey = null;
    await document.save();
  }
};

// ─── Service methods ─────────────────────────────────────────────────────────

/**
 * Authenticate a user and create a new session.
 *
 * @param {{ email: string, password: string, role: string }} credentials
 * @param {{ ipAddress?: string, userAgent?: string }}        meta
 * @returns {{ sessionKey: string, expiresAt: Date, user: object }}
 */
const login = async ({ email, password, role }, { ipAddress, userAgent } = {}) => {
  const config = ROLE_CONFIG[role];
  if (!config) {
    throw new AppError(`Invalid role '${role}'. Must be one of: admin, teacher, student, parent.`, 400);
  }

  const UserModel = config.getModel();

  // Fetch user with password (field is select:false by default)
  const user = await UserModel.findOne(buildLoginQuery(role, email)).select('+password');
  if (!user) {
    // Use a generic message to avoid user-enumeration
    throw new AppError('Invalid email or password.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!isUserActive(user)) {
    throw new AppError('Your account has been deactivated. Contact an administrator.', 401);
  }

  // Create session
  const sessionKey = uuidv4();
  const expiresAt = new Date(Date.now() + parseDurationMs(env.REFRESH_TOKEN_EXPIRES));

  await Session.create({
    userId: user._id,
    userModel: config.userModel,
    sessionKey,
    role,
    isActive: true,
    expiresAt,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  if ('sessionKey' in user) {
    user.sessionKey = sessionKey;
    await user.save();
  }

  const userObj = user.toObject();
  delete userObj.password;

  return {
    sessionKey,
    expiresAt,
    user: { ...userObj, role },
  };
};

/**
 * Invalidate a session (logout).
 *
 * @param {string} sessionKey
 */
const logout = async (sessionKey) => {
  const session = await Session.findOneAndUpdate(
    { sessionKey },
    { isActive: false },
    { new: true },
  );

  if (session) {
    await clearSessionKeyForUser(session.userModel, session.userId);
  }
};

/**
 * Invalidate ALL active sessions for a given user (force-logout from all devices).
 *
 * @param {string|ObjectId} userId
 */
const logoutAll = async (userId, role) => {
  await Session.updateMany({ userId, isActive: true }, { isActive: false });

  const roleConfig = ROLE_CONFIG[role];
  if (roleConfig) {
    await clearSessionKeyForUser(roleConfig.userModel, userId);
  }
};

module.exports = { login, logout, logoutAll };
