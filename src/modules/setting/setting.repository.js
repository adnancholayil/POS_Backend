const Settings = require('./setting.model');

class SettingRepository {
  async findByTenantId(tenantId) {
    return Settings.findOne({ tenantId });
  }

  async create(data) {
    return Settings.create(data);
  }

  async update(tenantId, data) {
    return Settings.findOneAndUpdate({ tenantId }, data, { new: true, runValidators: true, upsert: true });
  }
}

module.exports = new SettingRepository();
