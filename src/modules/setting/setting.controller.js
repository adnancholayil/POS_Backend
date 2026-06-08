const settingService = require('./setting.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getSettings = asyncHandler(async (req, res) => {
  const result = await settingService.getSettings(req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Settings retrieved successfully.', result));
});

const updateSettings = asyncHandler(async (req, res) => {
  const result = await settingService.updateSettings(req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Settings updated successfully.', result));
});

module.exports = {
  getSettings,
  updateSettings,
};
