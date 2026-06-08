const Attendance = require('./attendance.model');

class AttendanceRepository {
  async findAll({ tenantId, filter = {}, skip = 0, limit = 10, sort = { date: -1 } }) {
    return Attendance.find({ tenantId, ...filter })
      .populate('user', 'name email')
      .populate('markedBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count({ tenantId, filter = {} }) {
    return Attendance.countDocuments({ tenantId, ...filter });
  }

  async findByUserAndDate(userId, date, tenantId) {
    return Attendance.findOne({ user: userId, date, tenantId });
  }

  async findById(id, tenantId) {
    return Attendance.findOne({ _id: id, tenantId }).populate('user', 'name email');
  }

  async create(data) {
    return Attendance.create(data);
  }

  async update(id, tenantId, data) {
    return Attendance.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true })
      .populate('user', 'name email');
  }
}

module.exports = new AttendanceRepository();
