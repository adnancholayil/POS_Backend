const express = require('express');
const router = express.Router();
const controller = require('./setting.controller');
const { protect, hasPermission } = require('../../middlewares/auth.middleware');
const { body } = require('express-validator');
const validate = require('../../middlewares/validate.middleware');

router.use(protect);

router.get('/', hasPermission('settings:read'), controller.getSettings);

router.put('/', hasPermission('settings:update'), [
  body('shopName').optional().trim().notEmpty().withMessage('Shop name cannot be empty.'),
  body('shopEmail').optional().isEmail().withMessage('Invalid email format.'),
  body('defaultTaxRate').optional().isFloat({ min: 0 }).withMessage('Default tax rate must be positive.'),
], validate, controller.updateSettings);

module.exports = router;
