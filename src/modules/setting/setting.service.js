const settingRepository = require('./setting.repository');
const { createAuditLog } = require('../../middlewares/audit.middleware');

class SettingService {
  async getSettings(tenantId) {
    let settings = await settingRepository.findByTenantId(tenantId);
    if (!settings) {
      settings = await settingRepository.create({ tenantId });
    }
    return settings;
  }

  async updateSettings(tenantId, data, userId, ip) {
    const updated = await settingRepository.update(tenantId, data);
    await createAuditLog({
      userId,
      tenantId,
      action: 'update_settings',
      module: 'settings',
      details: { changes: data },
      ipAddress: ip,
    });
    return updated;
  }
}

module.exports = new SettingService();
