const taskService = require('./task.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getAllTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getAllTasks(req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Tasks fetched successfully.', result));
});

const getTaskById = asyncHandler(async (req, res) => {
  const result = await taskService.getTaskById(req.params.id, req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Task fetched successfully.', result));
});

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.tenantId, req.body, req.user._id, req.ip);
  res.status(201).json(new ApiResponse(201, 'Task created successfully.', task));
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Task updated successfully.', task));
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await taskService.updateTaskStatus(req.params.id, req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Task status updated successfully.', task));
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.tenantId, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Task deleted successfully.'));
});

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
