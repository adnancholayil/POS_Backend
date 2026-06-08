const usedDeviceService = require('./usedDevice.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getAllUsedDevices = asyncHandler(async (req, res) => {
  const result = await usedDeviceService.getAllUsedDevices(req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Used devices fetched successfully.', result));
});

const getUsedDeviceById = asyncHandler(async (req, res) => {
  const result = await usedDeviceService.getUsedDeviceById(req.params.id, req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Used device fetched successfully.', result));
});

const buybackDevice = asyncHandler(async (req, res) => {
  const device = await usedDeviceService.buybackDevice(req.tenantId, req.body, req.user._id, req.ip);
  res.status(201).json(new ApiResponse(201, 'Used device bought back successfully.', device));
});

const updateDeviceStatus = asyncHandler(async (req, res) => {
  const device = await usedDeviceService.updateDeviceStatus(req.params.id, req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Device status updated successfully.', device));
});

const resellDevice = asyncHandler(async (req, res) => {
  const device = await usedDeviceService.resellDevice(req.params.id, req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Device resold successfully.', device));
});

const deleteDevice = asyncHandler(async (req, res) => {
  await usedDeviceService.deleteDevice(req.params.id, req.tenantId, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Device record deleted successfully.'));
});

module.exports = {
  getAllUsedDevices,
  getUsedDeviceById,
  buybackDevice,
  updateDeviceStatus,
  resellDevice,
  deleteDevice,
};
