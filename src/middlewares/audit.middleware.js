const AuditLog = require('../modules/audit/auditLog.model');
const logger = require('../config/logger');

/**
 * Helper function to create an audit log entry.
 * Called directly from services, not as express middleware.
 */
const createAuditLog = async ({ userId, tenantId, action, module, details, ipAddress }) => {
  try {
    await AuditLog.create({ user: userId, tenantId, action, module, details, ipAddress });
  } catch (err) {
    logger.error(`Audit log creation failed: ${err.message}`);
  }
};

module.exports = { createAuditLog };
