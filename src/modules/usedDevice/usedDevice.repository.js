const UsedDevice = require('./usedDevice.model');

class UsedDeviceRepository {
  async findAll({ tenantId, filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } }) {
    return UsedDevice.find({ tenantId, ...filter })
      .populate('sourcedFrom', 'name phone')
      .populate('soldTo', 'name phone')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count({ tenantId, filter = {} }) {
    return UsedDevice.countDocuments({ tenantId, ...filter });
  }

  async findById(id, tenantId) {
    return UsedDevice.findOne({ _id: id, tenantId })
      .populate('sourcedFrom', 'name phone email')
      .populate('soldTo', 'name phone email');
  }

  async create(data) {
    return UsedDevice.create(data);
  }

  async update(id, tenantId, data) {
    return UsedDevice.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true });
  }

  async delete(id, tenantId) {
    return UsedDevice.findOneAndDelete({ _id: id, tenantId });
  }
}

module.exports = new UsedDeviceRepository();
