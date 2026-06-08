const Role = require('./role.model');
const Permission = require('./permission.model');
const ApiError = require('../../utils/apiError');
const { createAuditLog } = require('../../middlewares/audit.middleware');

class RoleService {
  async getAllRoles(tenantId) {
    return Role.find({ tenantId }).populate('permissions', 'name module description');
  }

  async getRoleById(id, tenantId) {
    const role = await Role.findOne({ _id: id, tenantId }).populate('permissions', 'name module description');
    if (!role) throw new ApiError(404, 'Role not found.');
    return role;
  }

  async updateRolePermissions(roleId, tenantId, permissionIds, updatedBy, ipAddress) {
    const role = await Role.findOne({ _id: roleId, tenantId });
    if (!role) throw new ApiError(404, 'Role not found.');
    if (role.name === 'admin') throw new ApiError(400, 'Admin role permissions cannot be modified.');

    // Validate all permissions exist
    const perms = await Permission.find({ _id: { $in: permissionIds } });
    if (perms.length !== permissionIds.length) throw new ApiError(400, 'One or more permission IDs are invalid.');

    role.permissions = permissionIds;
    await role.save();

    await createAuditLog({ userId: updatedBy, tenantId, action: 'update', module: 'roles', details: { roleId, permissions: permissionIds }, ipAddress });
    return role.populate('permissions', 'name module description');
  }

  async assignPermission(roleId, tenantId, permissionId, updatedBy, ipAddress) {
    const role = await Role.findOne({ _id: roleId, tenantId });
    if (!role) throw new ApiError(404, 'Role not found.');
    if (role.name === 'admin') throw new ApiError(400, 'Admin role permissions cannot be modified.');

    const perm = await Permission.findById(permissionId);
    if (!perm) throw new ApiError(404, 'Permission not found.');
    if (role.permissions.includes(permissionId)) throw new ApiError(400, 'Permission already assigned.');

    role.permissions.push(permissionId);
    await role.save();
    await createAuditLog({ userId: updatedBy, tenantId, action: 'update', module: 'roles', details: { roleId, added: permissionId }, ipAddress });
    return role.populate('permissions', 'name module');
  }

  async removePermission(roleId, tenantId, permissionId, updatedBy, ipAddress) {
    const role = await Role.findOne({ _id: roleId, tenantId });
    if (!role) throw new ApiError(404, 'Role not found.');
    if (role.name === 'admin') throw new ApiError(400, 'Admin role permissions cannot be modified.');

    role.permissions = role.permissions.filter((p) => p.toString() !== permissionId);
    await role.save();
    await createAuditLog({ userId: updatedBy, tenantId, action: 'update', module: 'roles', details: { roleId, removed: permissionId }, ipAddress });
    return role.populate('permissions', 'name module');
  }

  async getAllPermissions() {
    return Permission.find().sort({ module: 1, name: 1 });
  }
}

module.exports = new RoleService();
