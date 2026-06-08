const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const { authLimiter, passwordResetLimiter } = require('../../middlewares/limit.middleware');
const {
  registerValidation, loginValidation, forgotPasswordValidation,
  verifyOtpValidation, resetPasswordValidation, changePasswordValidation,
  resendVerificationValidation,
} = require('./auth.validation');

// Public routes
router.post('/register', authLimiter, registerValidation, validate, controller.register);
router.post('/login', authLimiter, loginValidation, validate, controller.login);
router.post('/refresh-token', controller.refreshToken);
router.get('/verify-email', controller.verifyEmail);
router.post('/resend-verification', authLimiter, resendVerificationValidation, validate, controller.resendVerification);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validate, controller.forgotPassword);
router.post('/verify-otp', authLimiter, verifyOtpValidation, validate, controller.verifyOtp);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, validate, controller.resetPassword);

// Protected routes
router.use(protect);
router.post('/logout', controller.logout);
router.get('/me', controller.getMe);
router.post('/change-password', changePasswordValidation, validate, controller.changePassword);

module.exports = router;
