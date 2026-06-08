const User = require('../user/user.model');
const Role = require('../role/role.model');

class AuthRepository {
  async findUserByEmail(email, tenantId, selectFields = '') {
    return User.findOne({ email, tenantId }).select(selectFields).populate({ path: 'role', populate: { path: 'permissions' } });
  }

  async findUserById(id, selectFields = '') {
    return User.findById(id).select(selectFields).populate({ path: 'role', populate: { path: 'permissions' } });
  }

  async createUser(data) {
    return User.create(data);
  }

  async updateUser(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async findRoleByName(name, tenantId) {
    return Role.findOne({ name, tenantId });
  }

  async findUserByResetToken(token) {
    return User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires +password');
  }

  async findUserByVerificationToken(token) {
    return User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');
  }

  async findUserByOtp(email, tenantId, otp, purpose) {
    return User.findOne({
      email,
      tenantId,
      otpCode: otp,
      otpExpires: { $gt: Date.now() },
      otpPurpose: purpose,
    }).select('+otpCode +otpExpires +otpPurpose +password');
  }

  async findUserByRefreshToken(token) {
    return User.findOne({ refreshToken: token }).select('+refreshToken').populate({ path: 'role', populate: { path: 'permissions' } });
  }
}

module.exports = new AuthRepository();
