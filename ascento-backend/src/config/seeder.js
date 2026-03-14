'use strict';

const logger = require('../utils/logger');
const env = require('./env');

/**
 * Seeds the default super admin on first startup.
 * Skips if an admin with ADMIN_EMAIL already exists.
 */
const seedAdmin = async () => {
  // Require here to avoid circular dependency during model loading
  const Admin = require('../models/admin.model');

  const existing = await Admin.findOne({ email: env.ADMIN_EMAIL });
  if (existing) {
    logger.info('Admin already exists — skipping seed');
    return;
  }

  await Admin.create({
    name: 'Super Admin',
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  });

  logger.info(`Default admin seeded: ${env.ADMIN_EMAIL}`);
};

module.exports = seedAdmin;
