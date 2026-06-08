const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authRepository = require('./auth.repository');
const ApiError = require('../../utils/apiError');
const { generateOTP, getOtpExpiry, generateToken } = require('../../utils/otp');
const { sendEmail } = require('../../config/mailer');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const Role = require('../role/role.model');
const Permission = require('../role/permission.model');
const Settings = require('../setting/setting.model');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_pos_9988';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_key_pos_1122';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

const signAccessToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
const signRefreshToken = (payload) => jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE });

const DEFAULT_PERMISSIONS = [
  // Products
  { name: 'products:create', module: 'products', description: 'Create products' },
  { name: 'products:read', module: 'products', description: 'View products' },
  { name: 'products:update', module: 'products', description: 'Update products' },
  { name: 'products:delete', module: 'products', description: 'Delete products' },
  // Inventory
  { name: 'inventory:read', module: 'inventory', description: 'View inventory' },
  { name: 'inventory:adjust', module: 'inventory', description: 'Adjust stock levels' },
  // Sales
  { name: 'sales:create', module: 'sales', description: 'Create sales' },
  { name: 'sales:read', module: 'sales', description: 'View sales' },
  { name: 'sales:update', module: 'sales', description: 'Update sales' },
  { name: 'sales:delete', module: 'sales', description: 'Delete sales' },
  { name: 'sales:return', module: 'sales', description: 'Process returns' },
  // Customers
  { name: 'customers:create', module: 'customers', description: 'Create customers' },
  { name: 'customers:read', module: 'customers', description: 'View customers' },
  { name: 'customers:update', module: 'customers', description: 'Update customers' },
  { name: 'customers:delete', module: 'customers', description: 'Delete customers' },
  // Repairs
  { name: 'repairs:create', module: 'repairs', description: 'Create repair tickets' },
  { name: 'repairs:read', module: 'repairs', description: 'View repair tickets' },
  { name: 'repairs:update', module: 'repairs', description: 'Update repair tickets' },
  // Tasks
  { name: 'tasks:create', module: 'tasks', description: 'Create tasks' },
  { name: 'tasks:read', module: 'tasks', description: 'View tasks' },
  { name: 'tasks:update', module: 'tasks', description: 'Update tasks' },
  // Reports
  { name: 'reports:read', module: 'reports', description: 'View reports' },
  // Users
  { name: 'users:read', module: 'users', description: 'View staff users' },
  { name: 'users:create', module: 'users', description: 'Create staff users' },
  { name: 'users:update', module: 'users', description: 'Update staff users' },
  { name: 'users:delete', module: 'users', description: 'Delete staff users' },
  // Settings
  { name: 'settings:read', module: 'settings', description: 'View settings' },
  { name: 'settings:update', module: 'settings', description: 'Update settings' },
  // Attendance
  { name: 'attendance:read', module: 'attendance', description: 'View attendance' },
  { name: 'attendance:mark', module: 'attendance', description: 'Mark attendance' },
  // Suppliers
  { name: 'suppliers:read', module: 'suppliers', description: 'View suppliers' },
  { name: 'suppliers:create', module: 'suppliers', description: 'Create suppliers' },
  { name: 'suppliers:update', module: 'suppliers', description: 'Update suppliers' },
];

const MANAGER_PERMISSIONS = [
  'products:create','products:read','products:update',
  'inventory:read','inventory:adjust',
  'sales:create','sales:read','sales:update','sales:return',
  'customers:create','customers:read','customers:update',
  'repairs:create','repairs:read','repairs:update',
  'tasks:create','tasks:read','tasks:update',
  'reports:read',
  'users:read',
  'attendance:read','attendance:mark',
  'suppliers:read','suppliers:create','suppliers:update',
];

const SALESMAN_PERMISSIONS = [
  'products:read',
  'inventory:read',
  'sales:create','sales:read',
  'customers:create','customers:read',
  'repairs:create','repairs:read',
  'tasks:read',
  'attendance:read',
];

class AuthService {
  // ─── REGISTER (Owner creates a new tenant) ────────────────────────────────
  async register(data) {
    const { name, email, password, shopName } = data;

    // Upsert all default permissions
    const permDocs = await Promise.all(
      DEFAULT_PERMISSIONS.map((p) =>
        Permission.findOneAndUpdate({ name: p.name }, p, { upsert: true, new: true })
      )
    );
    const permMap = {};
    permDocs.forEach((p) => { permMap[p.name] = p._id; });

    // Use a placeholder tenantId temporarily (will update after user created)
    const PLACEHOLDER = new (require('mongoose').Types.ObjectId)();

    // Create admin role (all permissions)
    const adminRole = await Role.create({
      name: 'admin',
      description: 'Full access role',
      permissions: permDocs.map((p) => p._id),
      tenantId: PLACEHOLDER,
      isDefault: true,
    });

    // Create manager role
    const managerPerms = MANAGER_PERMISSIONS.map((n) => permMap[n]).filter(Boolean);
    const managerRole = await Role.create({
      name: 'manager',
      description: 'Manager access role',
      permissions: managerPerms,
      tenantId: PLACEHOLDER,
      isDefault: true,
    });

    // Create salesman role
    const salesmanPerms = SALESMAN_PERMISSIONS.map((n) => permMap[n]).filter(Boolean);
    const salesmanRole = await Role.create({
      name: 'salesman',
      description: 'Salesman access role',
      permissions: salesmanPerms,
      tenantId: PLACEHOLDER,
      isDefault: true,
    });

    // Check if email already exists globally
    const existing = await require('../user/user.model').findOne({ email, tenantId: PLACEHOLDER });

    // Create the admin user — tenantId = their own _id
    const user = await authRepository.createUser({
      name,
      email,
      password,
      role: adminRole._id,
      tenantId: PLACEHOLDER, // temp
      status: 'pending',
      isEmailVerified: false,
    });

    // Set tenantId = own _id
    const tenantId = user._id;
    user.tenantId = tenantId;

    // Generate email verification token
    const verifyToken = generateToken();
    user.emailVerificationToken = verifyToken;
    user.emailVerificationExpires = getOtpExpiry(60 * 24); // 24h
    await user.save({ validateBeforeSave: false });

    // Update roles with correct tenantId
    await Role.updateMany({ tenantId: PLACEHOLDER }, { $set: { tenantId } });

    // Create default shop settings
    await Settings.create({ tenantId, shopName: shopName || name + "'s Shop" });

    // Send verification email
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
    await sendEmail({
      to: email,
      subject: 'Verify your email — Shop Manager Pro',
      html: `<p>Hello ${name},</p><p>Click the link below to verify your email:</p><a href="${verifyUrl}">${verifyUrl}</a><p>Link expires in 24 hours.</p>`,
    });

    return { userId: user._id, email: user.email };
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  async login(email, password, tenantId, ipAddress) {
    const user = await User.findOne({ email, tenantId })
      .select('+password +refreshToken')
      .populate({ path: 'role', populate: { path: 'permissions' } });

    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    if (user.status === 'suspended') {
      throw new ApiError(403, 'Account suspended. Contact your administrator.');
    }

    if (!user.isEmailVerified) {
      throw new ApiError(403, 'Email not verified. Please verify your email first.');
    }

    const tokenPayload = { id: user._id, tenantId: user.tenantId, role: user.role.name };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.status = 'active';
    await user.save({ validateBeforeSave: false });

    await createAuditLog({ userId: user._id, tenantId: user.tenantId, action: 'auth', module: 'auth', details: { event: 'login' }, ipAddress });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return { user: userObj, accessToken, refreshToken };
  }

  // ─── LOGOUT ───────────────────────────────────────────────────────────────
  async logout(userId) {
    await authRepository.updateUser(userId, { refreshToken: null });
  }

  // ─── REFRESH TOKEN ────────────────────────────────────────────────────────
  async refreshToken(token) {
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token.');
    }

    const user = await authRepository.findUserByRefreshToken(token);
    if (!user) throw new ApiError(401, 'Refresh token not recognized. Please login again.');

    const tokenPayload = { id: user._id, tenantId: user.tenantId, role: user.role.name };
    const accessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken: newRefreshToken };
  }

  // ─── VERIFY EMAIL ─────────────────────────────────────────────────────────
  async verifyEmail(token) {
    const user = await authRepository.findUserByVerificationToken(token);
    if (!user) throw new ApiError(400, 'Invalid or expired verification link.');

    user.isEmailVerified = true;
    user.status = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return true;
  }

  // ─── RESEND VERIFICATION EMAIL ────────────────────────────────────────────
  async resendVerification(email, tenantId) {
    const user = await User.findOne({ email, tenantId }).select('+emailVerificationToken +emailVerificationExpires');
    if (!user) throw new ApiError(404, 'User not found.');
    if (user.isEmailVerified) throw new ApiError(400, 'Email already verified.');

    const verifyToken = generateToken();
    user.emailVerificationToken = verifyToken;
    user.emailVerificationExpires = getOtpExpiry(60 * 24);
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
    await sendEmail({
      to: email,
      subject: 'Verify your email — Shop Manager Pro',
      html: `<p>Click below to verify:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
    });
    return true;
  }

  // ─── FORGOT PASSWORD ──────────────────────────────────────────────────────
  async forgotPassword(email, tenantId) {
    const user = await User.findOne({ email, tenantId });
    if (!user) {
      // Return success even if not found to prevent email enumeration
      return true;
    }

    const otp = generateOTP(6);
    user.otpCode = otp;
    user.otpExpires = getOtpExpiry(15);
    user.otpPurpose = 'password_reset';
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: email,
      subject: 'Password Reset OTP — Shop Manager Pro',
      html: `<p>Your password reset OTP is: <strong>${otp}</strong></p><p>Expires in 15 minutes.</p>`,
    });
    return true;
  }

  // ─── VERIFY OTP ───────────────────────────────────────────────────────────
  async verifyOtp(email, tenantId, otp, purpose) {
    const user = await authRepository.findUserByOtp(email, tenantId, otp, purpose);
    if (!user) throw new ApiError(400, 'Invalid or expired OTP.');
    return { verified: true, userId: user._id };
  }

  // ─── RESET PASSWORD ───────────────────────────────────────────────────────
  async resetPassword(email, tenantId, otp, newPassword) {
    const user = await authRepository.findUserByOtp(email, tenantId, otp, 'password_reset');
    if (!user) throw new ApiError(400, 'Invalid or expired OTP. Please request a new one.');

    user.password = newPassword;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpPurpose = undefined;
    user.refreshToken = undefined;
    await user.save();
    return true;
  }

  // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new ApiError(404, 'User not found.');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new ApiError(401, 'Current password is incorrect.');

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();
    return true;
  }

  // ─── SEND LOGIN OTP (2FA) ─────────────────────────────────────────────────
  async sendLoginOtp(email, tenantId) {
    const user = await User.findOne({ email, tenantId });
    if (!user) throw new ApiError(404, 'User not found.');

    const otp = generateOTP(6);
    user.otpCode = otp;
    user.otpExpires = getOtpExpiry(10);
    user.otpPurpose = 'login_2fa';
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: email,
      subject: 'Login OTP — Shop Manager Pro',
      html: `<p>Your login OTP is: <strong>${otp}</strong></p><p>Expires in 10 minutes.</p>`,
    });
    return true;
  }
}

const User = require('../user/user.model');

module.exports = new AuthService();
