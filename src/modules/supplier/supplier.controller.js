const supplierService = require('./supplier.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

// Suppliers
const getAllSuppliers = asyncHandler(async (req, res) => {
  const result = await supplierService.getAllSuppliers(req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Suppliers fetched successfully.', result));
});

const getSupplierById = asyncHandler(async (req, res) => {
  const result = await supplierService.getSupplierById(req.params.id, req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Supplier fetched successfully.', result));
});

const createSupplier = asyncHandler(async (req, res) => {
  const result = await supplierService.createSupplier(req.tenantId, req.body, req.user._id, req.ip);
  res.status(201).json(new ApiResponse(201, 'Supplier created successfully.', result));
});

const updateSupplier = asyncHandler(async (req, res) => {
  const result = await supplierService.updateSupplier(req.params.id, req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Supplier updated successfully.', result));
});

const deleteSupplier = asyncHandler(async (req, res) => {
  await supplierService.deleteSupplier(req.params.id, req.tenantId, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Supplier deleted successfully.'));
});

// Purchase Orders
const getAllPOs = asyncHandler(async (req, res) => {
  const result = await supplierService.getAllPOs(req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Purchase Orders fetched successfully.', result));
});

const getPOById = asyncHandler(async (req, res) => {
  const result = await supplierService.getPOById(req.params.id, req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Purchase Order fetched successfully.', result));
});

const createPO = asyncHandler(async (req, res) => {
  const result = await supplierService.createPO(req.tenantId, req.body, req.user._id, req.ip);
  res.status(201).json(new ApiResponse(201, 'Purchase Order created successfully.', result));
});

const updatePOStatus = asyncHandler(async (req, res) => {
  const result = await supplierService.updatePOStatus(req.params.id, req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Purchase Order status updated successfully.', result));
});

const receivePOItems = asyncHandler(async (req, res) => {
  const result = await supplierService.receivePOItems(req.params.id, req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Items received and inventory updated successfully.', result));
});

const createAndReceivePO = asyncHandler(async (req, res) => {
  const result = await supplierService.createAndReceivePO(req.tenantId, req.body, req.user._id, req.ip);
  const message = result.stockInErrors && result.stockInErrors.length > 0
    ? `Purchase order created. Some stock-in errors: ${result.stockInErrors.join('; ')}`
    : 'Purchase order created and all items received. Inventory updated.';
  res.status(201).json(new ApiResponse(201, message, result.po));
});

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getAllPOs,
  getPOById,
  createPO,
  updatePOStatus,
  receivePOItems,
  createAndReceivePO,
};
