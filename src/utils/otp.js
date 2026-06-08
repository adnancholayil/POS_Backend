const crypto = require('crypto');

/**
 * Generate a numeric OTP of specified length
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

/**
 * Generate a cryptographically secure random token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Get OTP expiry time (default: 10 minutes)
 */
const getOtpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Check if OTP or token has expired
 */
const isExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

module.exports = { generateOTP, generateToken, getOtpExpiry, isExpired };
