const express = require('express');
const router = express.Router();
const controller = require('./supplier.controller');
const { protect, hasPermission } = require('../../middlewares/auth.middleware');
const { body } = require('express-validator');
const validate = require('../../middlewares/validate.middleware');

router.use(protect);

// Purchase Orders Routes
router.get('/purchase-orders', hasPermission('suppliers:read'), controller.getAllPOs);
router.get('/purchase-orders/:id', hasPermission('suppliers:read'), controller.getPOById);
router.post('/purchase-orders', hasPermission('suppliers:create'), [
  body('supplierId').isMongoId().withMessage('Invalid supplier ID.'),
  body('items').isArray({ min: 1 }).withMessage('Items must be an array with at least 1 item.'),
  body('items.*.productId').isMongoId().withMessage('Invalid product ID.'),
  body('items.*.productName').notEmpty().withMessage('Product name is required.'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1.'),
  body('items.*.unitCost').isFloat({ min: 0 }).withMessage('Unit cost must be positive.'),
], validate, controller.createPO);
router.patch('/purchase-orders/:id/status', hasPermission('suppliers:update'), [
  body('status').isIn(['draft', 'ordered', 'cancelled']).withMessage('Invalid PO status.'),
], validate, controller.updatePOStatus);
router.post('/purchase-orders/:id/receive', hasPermission('suppliers:update'), [
  body('itemsReceived').isArray({ min: 1 }).withMessage('itemsReceived must be a non-empty array.'),
  body('itemsReceived.*.itemId').isMongoId().withMessage('Invalid PO item ID.'),
  body('itemsReceived.*.quantity').isInt({ min: 1 }).withMessage('Quantity received must be at least 1.'),
  body('itemsReceived.*.imeiList').optional().isArray().withMessage('imeiList must be an array of strings.'),
], validate, controller.receivePOItems);

// Supplier CRUD Routes
router.get('/', hasPermission('suppliers:read'), controller.getAllSuppliers);
router.get('/:id', hasPermission('suppliers:read'), controller.getSupplierById);
router.post('/', hasPermission('suppliers:create'), [
  body('name').trim().notEmpty().withMessage('Supplier name is required.'),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email format.'),
], validate, controller.createSupplier);
router.put('/:id', hasPermission('suppliers:update'), [
  body('name').optional().trim().notEmpty().withMessage('Supplier name cannot be empty.'),
  body('email').optional().isEmail().withMessage('Invalid email format.'),
], validate, controller.updateSupplier);
router.delete('/:id', hasPermission('suppliers:delete'), controller.deleteSupplier);

module.exports = router;
