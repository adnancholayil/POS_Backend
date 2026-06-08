const notificationService = require('./notification.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Notifications fetched successfully.', result));
});

const markAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAsRead(req.params.id, req.user._id, req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Notification marked as read successfully.', result));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id, req.tenantId);
  res.status(200).json(new ApiResponse(200, 'All notifications marked as read.', result));
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
