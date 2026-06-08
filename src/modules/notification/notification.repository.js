const Notification = require('./notification.model');

class NotificationRepository {
  async findAll({ recipient, tenantId, skip = 0, limit = 10 }) {
    const filter = { tenantId };
    if (recipient) filter.recipient = recipient;
    return Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async count({ recipient, tenantId }) {
    const filter = { tenantId };
    if (recipient) filter.recipient = recipient;
    return Notification.countDocuments(filter);
  }

  async markAsRead(id, recipient, tenantId) {
    return Notification.findOneAndUpdate(
      { _id: id, recipient, tenantId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  async markAllAsRead(recipient, tenantId) {
    return Notification.updateMany(
      { recipient, tenantId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  async create(data) {
    return Notification.create(data);
  }
}

module.exports = new NotificationRepository();
