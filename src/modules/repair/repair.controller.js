const repairService = require('./repair.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getAllRepairs = asyncHandler(async (req, res) => {
  const result = await repairService.getAllRepairs(req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Repairs fetched successfully.', result));
});

const getRepairById = asyncHandler(async (req, res) => {
  const result = await repairService.getRepairById(req.params.id, req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Repair ticket fetched successfully.', result));
});

const createRepair = asyncHandler(async (req, res) => {
  const repair = await repairService.createRepair(req.tenantId, req.body, req.user._id, req.ip);
  res.status(201).json(new ApiResponse(201, 'Repair ticket created successfully.', repair));
});

const updateRepair = asyncHandler(async (req, res) => {
  const repair = await repairService.updateRepair(req.params.id, req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Repair ticket updated successfully.', repair));
});

const updateStatus = asyncHandler(async (req, res) => {
  const repair = await repairService.updateStatus(req.params.id, req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Repair status updated successfully.', repair));
});

const addPart = asyncHandler(async (req, res) => {
  const part = await repairService.addPart(req.params.id, req.tenantId, req.body, req.user._id, req.ip);
  res.status(201).json(new ApiResponse(201, 'Spare part added successfully.', part));
});

const removePart = asyncHandler(async (req, res) => {
  await repairService.removePart(req.params.id, req.tenantId, req.params.partId, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Spare part removed successfully.'));
});

const getTechnicians = asyncHandler(async (req, res) => {
  const result = await repairService.getTechnicians(req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Technicians fetched successfully.', result));
});

const updateTechnician = asyncHandler(async (req, res) => {
  const tech = await repairService.updateTechnician(req.params.userId, req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Technician status/info updated successfully.', tech));
});

module.exports = {
  getAllRepairs,
  getRepairById,
  createRepair,
  updateRepair,
  updateStatus,
  addPart,
  removePart,
  getTechnicians,
  updateTechnician,
};
