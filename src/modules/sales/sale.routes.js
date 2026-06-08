const express = require('express');
const router = express.Router();
const controller = require('./sale.controller');
const { protect, hasPermission } = require('../../middlewares/auth.middleware');
const { body } = require('express-validator');
const validate = require('../../middlewares/validate.middleware');

router.use(protect);

router.get('/', hasPermission('sales:read'), controller.getAllSales);
router.get('/:id', hasPermission('sales:read'), controller.getSaleById);
router.get('/:id/invoice', hasPermission('sales:read'), controller.getInvoice);

router.post('/', hasPermission('sales:create'), [
  body('items').isArray({ min: 1 }).withMessage('items must be an array with at least 1 item.'),
  body('items.*.productId').notEmpty().withMessage('productId is required for all items.'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity must be at least 1.'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('unitPrice must be a positive number.'),
  body('paymentMethod').notEmpty().withMessage('paymentMethod is required.'),
], validate, controller.createSale);

router.post('/:id/return', hasPermission('sales:update'), [
  body('itemId').notEmpty().withMessage('itemId is required.'),
  body('quantity').isInt({ min: 1 }).withMessage('quantity must be at least 1.'),
], validate, controller.processReturn);

router.delete('/:id', hasPermission('sales:delete'), controller.deleteSale);

module.exports = router;
