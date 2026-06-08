const reportService = require('./report.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getOverviewStats = asyncHandler(async (req, res) => {
  const result = await reportService.getOverviewStats(req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Overview stats fetched successfully.', result));
});

const getSalesReport = asyncHandler(async (req, res) => {
  const result = await reportService.getSalesReport(req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Sales report fetched successfully.', result));
});

const getProfitReport = asyncHandler(async (req, res) => {
  const result = await reportService.getProfitReport(req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Profit report fetched successfully.', result));
});

const getInventoryValuation = asyncHandler(async (req, res) => {
  const result = await reportService.getInventoryValuation(req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Inventory valuation fetched successfully.', result));
});

const getStaffPerformance = asyncHandler(async (req, res) => {
  const result = await reportService.getStaffPerformance(req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Staff performance fetched successfully.', result));
});

module.exports = {
  getOverviewStats,
  getSalesReport,
  getProfitReport,
  getInventoryValuation,
  getStaffPerformance,
};
