const express = require('express');
const router = express.Router();
const c = require('./inventory.controller');
const { protect, hasPermission } = require('../../middlewares/auth.middleware');

router.use(protect);
router.get('/', hasPermission('inventory:read'), c.getAllInventory);
router.get('/low-stock', hasPermission('inventory:read'), c.getLowStock);
router.get('/history', hasPermission('inventory:read'), c.getHistory);
router.post('/stock-in', hasPermission('inventory:adjust'), c.stockIn);
router.post('/stock-out', hasPermission('inventory:adjust'), c.stockOut);
router.post('/adjust', hasPermission('inventory:adjust'), c.adjustStock);
router.patch('/threshold', hasPermission('inventory:adjust'), c.updateThreshold);

module.exports = router;
