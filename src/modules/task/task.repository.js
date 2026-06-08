const Task = require('./task.model');

class TaskRepository {
  async findAll({ tenantId, filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } }) {
    return Task.find({ tenantId, ...filter })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count({ tenantId, filter = {} }) {
    return Task.countDocuments({ tenantId, ...filter });
  }

  async findById(id, tenantId) {
    return Task.findOne({ _id: id, tenantId })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
  }

  async create(data) {
    return Task.create(data);
  }

  async update(id, tenantId, data) {
    return Task.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
  }

  async delete(id, tenantId) {
    return Task.findOneAndDelete({ _id: id, tenantId });
  }
}

module.exports = new TaskRepository();
