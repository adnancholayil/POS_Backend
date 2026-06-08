const notificationRepository = require('./notification.repository');
const ApiError = require('../../utils/apiError');
const { getPagination, getPaginationMeta } = require('../../utils/queryHelper');
const { emitToUser } = require('../../config/socket');

class NotificationService {
  async getNotifications(recipient, tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const [notifications, total] = await Promise.all([
      notificationRepository.findAll({ recipient, tenantId, skip, limit }),
      notificationRepository.count({ recipient, tenantId }),
    ]);
    return { notifications, pagination: getPaginationMeta(total, page, limit) };
  }

  async markAsRead(id, recipient, tenantId) {
    const notification = await notificationRepository.markAsRead(id, recipient, tenantId);
    if (!notification) throw new ApiError(404, 'Notification not found.');
    return notification;
  }

  async markAllAsRead(recipient, tenantId) {
    await notificationRepository.markAllAsRead(recipient, tenantId);
    return { success: true };
  }

  async createNotification(tenantId, { recipient, title, message, type, link }) {
    const notification = await notificationRepository.create({
      recipient,
      title,
      message,
      type,
      link,
      tenantId,
    });

    // Broadcast to user socket if online
    try {
      emitToUser(recipient.toString(), 'notification', notification);
    } catch (_) {}

    return notification;
  }
}

module.exports = new NotificationService();
