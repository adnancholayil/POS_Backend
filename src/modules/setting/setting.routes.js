const express = require('express');
const router = express.Router();
const controller = require('./setting.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { body } = require('express-validator');
const validate = require('../../middlewares/validate.middleware');

// All settings routes require a valid JWT — no role restriction
router.use(protect);

router.get('/', controller.getSettings);

router.put('/', [
  body('shopName').optional().trim().notEmpty().withMessage('Shop name cannot be empty.'),
  body('shopEmail').optional().isEmail().withMessage('Invalid email format.'),
  body('defaultTaxRate').optional().isFloat({ min: 0 }).withMessage('Default tax rate must be positive.'),
], validate, controller.updateSettings);

module.exports = router;
