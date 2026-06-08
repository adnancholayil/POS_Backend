const express = require('express');
const router = express.Router();
const controller = require('./report.controller');
const { protect, hasPermission } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/overview', hasPermission('reports:read'), controller.getOverviewStats);
router.get('/sales', hasPermission('reports:read'), controller.getSalesReport);
router.get('/profit', hasPermission('reports:read'), controller.getProfitReport);
router.get('/inventory-valuation', hasPermission('reports:read'), controller.getInventoryValuation);
router.get('/staff-performance', hasPermission('reports:read'), controller.getStaffPerformance);

module.exports = router;
