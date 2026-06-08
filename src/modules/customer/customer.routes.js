const express = require('express');
const router = express.Router();
const c = require('./customer.controller');
const { protect, hasPermission } = require('../../middlewares/auth.middleware');

router.use(protect);
router.get('/search', hasPermission('customers:read'), c.searchCustomers);
router.get('/:id/history', hasPermission('customers:read'), c.getCustomerHistory);
router.get('/', hasPermission('customers:read'), c.getAllCustomers);
router.get('/:id', hasPermission('customers:read'), c.getCustomerById);
router.post('/', hasPermission('customers:create'), c.createCustomer);
router.patch('/:id', hasPermission('customers:update'), c.updateCustomer);
router.delete('/:id', hasPermission('customers:delete'), c.deleteCustomer);

module.exports = router;
