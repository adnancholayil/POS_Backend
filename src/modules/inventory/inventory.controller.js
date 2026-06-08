const inventoryService = require('./inventory.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getAllInventory = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Inventory fetched.', await inventoryService.getAllInventory(req.tenantId, req.query))); });
const getLowStock = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Low stock items.', await inventoryService.getLowStockItems(req.tenantId))); });
const getHistory = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Inventory movements.', await inventoryService.getHistory(req.tenantId, req.query))); });
const stockIn = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Stock added.', await inventoryService.stockIn(req.tenantId, req.body, req.user._id))); });
const stockOut = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Stock removed.', await inventoryService.stockOut(req.tenantId, req.body, req.user._id))); });
const adjustStock = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Stock adjusted.', await inventoryService.adjustStock(req.tenantId, req.body, req.user._id))); });
const updateThreshold = asyncHandler(async (req, res) => {
  const result = await inventoryService.updateThreshold(req.tenantId, req.body.productId, req.body.variantId, req.body.threshold);
  res.status(200).json(new ApiResponse(200, 'Threshold updated.', result));
});

module.exports = { getAllInventory, getLowStock, getHistory, stockIn, stockOut, adjustStock, updateThreshold };
