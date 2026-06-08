const auditRepository = require('./audit.repository');
const { getPagination, getPaginationMeta } = require('../../utils/queryHelper');

class AuditService {
  async getAuditLogs(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};
    if (query.userId) filter.user = query.userId;
    if (query.action) filter.action = query.action;
    if (query.module) filter.module = query.module;

    const [logs, total] = await Promise.all([
      auditRepository.findAll({ tenantId, filter, skip, limit }),
      auditRepository.count({ tenantId, filter }),
    ]);

    return { logs, pagination: getPaginationMeta(total, page, limit) };
  }
}

module.exports = new AuditService();
