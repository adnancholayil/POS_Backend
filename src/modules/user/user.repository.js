const User = require('./user.model');
const Role = require('../role/role.model');

class UserRepository {
  async findAll({ tenantId, filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } }) {
    return User.find({ tenantId, ...filter })
      .populate('role', 'name description')
      .sort(sort).skip(skip).limit(limit);
  }

  async count({ tenantId, filter = {} }) {
    return User.countDocuments({ tenantId, ...filter });
  }

  async findById(id, tenantId) {
    return User.findOne({ _id: id, tenantId }).populate('role', 'name description permissions');
  }

  async create(data) {
    return User.create(data);
  }

  async update(id, tenantId, data) {
    return User.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true }).populate('role', 'name');
  }

  async delete(id, tenantId) {
    return User.findOneAndDelete({ _id: id, tenantId });
  }
}

module.exports = new UserRepository();
