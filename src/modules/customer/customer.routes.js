const express = require('express');
const router = express.Router();
const c = require('./customer.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);
router.get('/search', c.searchCustomers);
router.get('/:id/history', c.getCustomerHistory);
router.get('/', c.getAllCustomers);
router.get('/:id', c.getCustomerById);
router.post('/', c.createCustomer);
router.patch('/:id', c.updateCustomer);
router.delete('/:id', c.deleteCustomer);

module.exports = router;
