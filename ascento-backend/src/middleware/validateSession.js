'use strict';

const AppError = require('../core/AppError');
const asyncHandler = require('../core/asyncHandler');
const Session = require('../models/Session.model');

const isUserActive = (user) => {
  if (typeof user.isActive === 'boolean') {
    return user.isActive;
  }

  if (typeof user.status === 'string') {
    return user.status === 'active';
  }

  return true;
};

/**
 * Returns the Mongoose model for the given role.
 * Loaded lazily to avoid circular-dependency issues at startup.
 */
const getModelForRole = (role) => {
  switch (role) {
    case 'admin':   return require('../models/admin.model');
    case 'teacher': return require('../models/teacher.model');
    case 'student': return require('../models/student.model');
    case 'parent':  return require('../models/parent.model');
    default:        return null;
  }
};

/**
 * validateSession — Session-key authentication middleware.
 *
 * The client must include the header:  x-session-key: <uuid>
 *
 * Flow:
 *   1. Read `x-session-key` from request headers.
 *   2. Find the matching Session document that is active and not expired.
 *   3. Load the user record for that session's role and attach to req.
 *
 * Attaches to req:
 *   req.user       — Plain user object (password field excluded)
 *   req.user.role  — Role string stored on the session
 *   req.sessionKey — The raw session-key string
 *   req.session    — The active Session Mongoose document
 */
const validateSession = asyncHandler(async (req, res, next) => {
  const sessionKey = req.headers['x-session-key'];

  if (!sessionKey || typeof sessionKey !== 'string' || !sessionKey.trim()) {
    throw new AppError('Missing session key. Include the x-session-key header.', 401);
  }

  const session = await Session.findOne({
    sessionKey: sessionKey.trim(),
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    throw new AppError('Session not found, expired, or revoked. Please log in again.', 401);
  }

  const UserModel = getModelForRole(session.role);
  if (!UserModel) {
    throw new AppError('Unrecognised role associated with this session.', 401);
  }

  const user = await UserModel.findById(session.userId).select('-password');
  if (!user) {
    throw new AppError('User account not found.', 401);
  }

  if (!isUserActive(user)) {
    throw new AppError('User account has been deactivated.', 401);
  }

  req.user = user.toObject();
  req.user.role = session.role;
  req.sessionKey = session.sessionKey;
  req.session = session;

  next();
});

module.exports = validateSession;
