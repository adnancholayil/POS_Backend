const userService = require('./user.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Users fetched.', result));
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id, req.tenantId);
  res.status(200).json(new ApiResponse(200, 'User fetched.', user));
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.tenantId, req.body, req.user._id, req.ip);
  res.status(201).json(new ApiResponse(201, 'User created.', user));
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'User updated.', user));
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.tenantId, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'User deleted.'));
});

const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json(new ApiResponse(400, 'No image file provided.'));
  const user = await userService.updateAvatar(req.user._id, req.tenantId, req.file.filename);
  res.status(200).json(new ApiResponse(200, 'Avatar updated.', user));
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.tenantId, req.body);
  res.status(200).json(new ApiResponse(200, 'Profile updated.', user));
});

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, updateAvatar, updateProfile };
