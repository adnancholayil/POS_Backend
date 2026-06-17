const Settings = require('./setting.model');

class SettingRepository {
  async findByTenantId(tenantId) {
    return Settings.findOne({ tenantId });
  }

  async create(data) {
    return Settings.create(data);
  }

  async update(tenantId, data) {
    return Settings.findOneAndUpdate(
      { tenantId },
      { $set: data },
      { new: true, runValidators: false, upsert: true }
    );
  }
}

module.exports = new SettingRepository();
