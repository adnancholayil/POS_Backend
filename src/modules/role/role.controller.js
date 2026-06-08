const roleService = require('./role.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.getAllRoles(req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Roles fetched.', roles));
});

const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id, req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Role fetched.', role));
});

const getAllPermissions = asyncHandler(async (req, res) => {
  const permissions = await roleService.getAllPermissions();
  res.status(200).json(new ApiResponse(200, 'Permissions fetched.', permissions));
});

const updateRolePermissions = asyncHandler(async (req, res) => {
  const role = await roleService.updateRolePermissions(req.params.id, req.tenantId, req.body.permissions, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Role permissions updated.', role));
});

const assignPermission = asyncHandler(async (req, res) => {
  const role = await roleService.assignPermission(req.params.id, req.tenantId, req.body.permissionId, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Permission assigned.', role));
});

const removePermission = asyncHandler(async (req, res) => {
  const role = await roleService.removePermission(req.params.id, req.tenantId, req.params.permissionId, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Permission removed.', role));
});

module.exports = { getAllRoles, getRoleById, getAllPermissions, updateRolePermissions, assignPermission, removePermission };
