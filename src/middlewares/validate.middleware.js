const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

/**
 * Middleware to run after express-validator chains.
 * Collects all validation errors and throws a structured ApiError.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return next(new ApiError(422, 'Validation failed', errorMessages));
  }
  next();
};

module.exports = validate;
