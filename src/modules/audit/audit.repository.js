const AuditLog = require('./auditLog.model');

class AuditRepository {
  async findAll({ tenantId, filter = {}, skip = 0, limit = 10 }) {
    return AuditLog.find({ tenantId, ...filter })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async count({ tenantId, filter = {} }) {
    return AuditLog.countDocuments({ tenantId, ...filter });
  }

  async create(data) {
    return AuditLog.create(data);
  }
}

module.exports = new AuditRepository();
