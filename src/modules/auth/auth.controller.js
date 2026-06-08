const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(new ApiResponse(201, 'Registration successful. Please verify your email.', result));
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password, tenantId } = req.body;
  const result = await authService.login(email, password, tenantId, req.ip);
  res
    .cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS)
    .status(200)
    .json(new ApiResponse(200, 'Login successful.', { user: result.user, accessToken: result.accessToken }));
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  res
    .clearCookie('refreshToken')
    .status(200)
    .json(new ApiResponse(200, 'Logged out successfully.'));
});

// POST /api/auth/refresh-token
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) {
    return res.status(401).json(new ApiResponse(401, 'Refresh token not provided.'));
  }
  const result = await authService.refreshToken(token);
  res
    .cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS)
    .status(200)
    .json(new ApiResponse(200, 'Token refreshed.', { accessToken: result.accessToken }));
});

// GET /api/auth/verify-email?token=xxx
const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(200).json(new ApiResponse(200, 'Email verified successfully. You can now login.'));
});

// POST /api/auth/resend-verification
const resendVerification = asyncHandler(async (req, res) => {
  const { email, tenantId } = req.body;
  await authService.resendVerification(email, tenantId);
  res.status(200).json(new ApiResponse(200, 'Verification email resent.'));
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, tenantId } = req.body;
  await authService.forgotPassword(email, tenantId);
  res.status(200).json(new ApiResponse(200, 'If that email is registered, an OTP has been sent.'));
});

// POST /api/auth/verify-otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, tenantId, otp, purpose } = req.body;
  const result = await authService.verifyOtp(email, tenantId, otp, purpose || 'password_reset');
  res.status(200).json(new ApiResponse(200, 'OTP verified.', result));
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, tenantId, otp, newPassword } = req.body;
  await authService.resetPassword(email, tenantId, otp, newPassword);
  res.status(200).json(new ApiResponse(200, 'Password reset successfully. Please login.'));
});

// POST /api/auth/change-password  (protected)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, currentPassword, newPassword);
  res.status(200).json(new ApiResponse(200, 'Password changed successfully. Please login again.'));
});

// GET /api/auth/me  (protected)
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, 'Profile fetched.', req.user));
});

module.exports = {
  register, login, logout, refreshToken,
  verifyEmail, resendVerification,
  forgotPassword, verifyOtp, resetPassword, changePassword,
  getMe,
};
