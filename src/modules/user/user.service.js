const userRepository = require('./user.repository');
const ApiError = require('../../utils/apiError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getPagination, getPaginationMeta, getSort } = require('../../utils/queryHelper');
const { uploadImage } = require('../../config/cloudinary');
const Role = require('../role/role.model');

class UserService {
  async getAllUsers(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const sort = getSort(query, ['name', 'email', 'createdAt', 'status']);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.role) filter.role = query.role;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }
    const [users, total] = await Promise.all([
      userRepository.findAll({ tenantId, filter, skip, limit, sort }),
      userRepository.count({ tenantId, filter }),
    ]);
    return { users, pagination: getPaginationMeta(total, page, limit) };
  }

  async getUserById(id, tenantId) {
    const user = await userRepository.findById(id, tenantId);
    if (!user) throw new ApiError(404, 'User not found.');
    return user;
  }

  async createUser(tenantId, data, createdBy, ipAddress) {
    const role = await Role.findOne({ _id: data.role, tenantId });
    if (!role) throw new ApiError(404, 'Role not found in your tenant.');

    const user = await userRepository.create({
      ...data,
      tenantId,
      status: 'active',
      isEmailVerified: true,
    });

    await createAuditLog({ userId: createdBy, tenantId, action: 'create', module: 'users', details: { userId: user._id, email: user.email }, ipAddress });
    return user;
  }

  async updateUser(id, tenantId, data, updatedBy, ipAddress) {
    if (data.password) delete data.password; // password changes go through changePassword
    const user = await userRepository.update(id, tenantId, data);
    if (!user) throw new ApiError(404, 'User not found.');
    await createAuditLog({ userId: updatedBy, tenantId, action: 'update', module: 'users', details: { userId: id }, ipAddress });
    return user;
  }

  async deleteUser(id, tenantId, deletedBy, ipAddress) {
    if (id.toString() === deletedBy.toString()) throw new ApiError(400, 'You cannot delete your own account.');
    const user = await userRepository.delete(id, tenantId);
    if (!user) throw new ApiError(404, 'User not found.');
    await createAuditLog({ userId: deletedBy, tenantId, action: 'delete', module: 'users', details: { userId: id, email: user.email }, ipAddress });
    return true;
  }

  async updateAvatar(userId, tenantId, fileBuffer, mimetype) {
    if (!fileBuffer) throw new ApiError(400, 'No file provided.');
    const base64 = `data:${mimetype};base64,${fileBuffer.toString('base64')}`;
    const result = await uploadImage(base64, 'pos_avatars');
    const user = await userRepository.update(userId, tenantId, { avatar: result.secure_url });
    return user;
  }

  async updateProfile(userId, tenantId, data) {
    const allowed = { name: data.name, phone: data.phone };
    const user = await userRepository.update(userId, tenantId, allowed);
    if (!user) throw new ApiError(404, 'User not found.');
    return user;
  }
}

module.exports = new UserService();
