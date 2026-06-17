const express = require('express');
const router = express.Router();
const controller = require('./report.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/overview', controller.getOverviewStats);
router.get('/sales', controller.getSalesReport);
router.get('/profit', controller.getProfitReport);
router.get('/inventory-valuation', controller.getInventoryValuation);
router.get('/staff-performance', controller.getStaffPerformance);

module.exports = router;
