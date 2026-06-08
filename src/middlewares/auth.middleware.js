const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const User = require('../modules/user/user.model');
const Role = require('../modules/role/role.model');

/**
 * Verify JWT and attach user to request
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, 'Access denied. No token provided.');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_key_pos_9988');

  const user = await User.findById(decoded.id)
    .select('-password -refreshToken -otpCode')
    .populate({ path: 'role', populate: { path: 'permissions', select: 'name module' } });

  if (!user) {
    throw new ApiError(401, 'User not found. Token invalid.');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, `Account is ${user.status}. Please contact your administrator.`);
  }

  req.user = user;
  req.tenantId = user.tenantId;
  next();
});

/**
 * Restrict access to specific roles
 * Usage: authorize('admin', 'manager')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ApiError(403, 'Access denied. No role assigned.'));
    }
    const userRoleName = req.user.role.name;
    if (!roles.includes(userRoleName)) {
      return next(new ApiError(403, `Role '${userRoleName}' is not authorized to access this resource.`));
    }
    next();
  };
};

/**
 * Check for a specific permission by name
 * Usage: hasPermission('products:create')
 */
const hasPermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ApiError(403, 'Access denied.'));
    }

    // Admin has all permissions
    if (req.user.role.name === 'admin') return next();

    const permissions = req.user.role.permissions || [];
    const hasIt = permissions.some((p) => p.name === permissionName);

    if (!hasIt) {
      return next(new ApiError(403, `You do not have permission: '${permissionName}'.`));
    }
    next();
  };
};

module.exports = { protect, authorize, hasPermission };
