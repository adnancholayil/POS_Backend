const express = require('express');
const router = express.Router();
const c = require('./inventory.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);
router.get('/', c.getAllInventory);
router.get('/low-stock', c.getLowStock);
router.get('/history', c.getHistory);
router.post('/stock-in', c.stockIn);
router.post('/stock-out', c.stockOut);
router.post('/adjust', c.adjustStock);
router.patch('/threshold', c.updateThreshold);

module.exports = router;
