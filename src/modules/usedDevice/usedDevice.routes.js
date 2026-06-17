const express = require('express');
const router = express.Router();
const controller = require('./usedDevice.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { body } = require('express-validator');
const validate = require('../../middlewares/validate.middleware');

router.use(protect);

router.get('/', controller.getAllUsedDevices);
router.get('/:id', controller.getUsedDeviceById);

router.post('/', [
  body('deviceType').isIn(['mobile', 'laptop', 'tablet', 'other']).withMessage('Invalid device type.'),
  body('deviceModel').trim().notEmpty().withMessage('Device model is required.'),
  body('condition').isIn(['excellent', 'good', 'fair', 'poor']).withMessage('Invalid condition.'),
  body('buyingPrice').isFloat({ min: 0 }).withMessage('Buying price must be a positive number.'),
  body('sourcedFromName').trim().notEmpty().withMessage('Sourced from name is required.'),
], validate, controller.buybackDevice);

router.patch('/:id/status', [
  body('status').isIn(['purchased', 'refurbishing', 'ready_for_sale', 'sold', 'scrapped']).withMessage('Invalid status.'),
  body('sellingPrice').optional().isFloat({ min: 0 }).withMessage('Selling price must be positive.'),
  body('evaluationNotes').optional().trim(),
], validate, controller.updateDeviceStatus);

router.post('/:id/resell', [
  body('soldTo').isMongoId().withMessage('Invalid customer ID for soldTo.'),
  body('soldVia').isMongoId().withMessage('Invalid sale ID for soldVia.'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a positive number.'),
], validate, controller.resellDevice);

router.delete('/:id', controller.deleteDevice);

module.exports = router;
