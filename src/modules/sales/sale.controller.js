const saleService = require('./sale.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getAllSales = asyncHandler(async (req, res) => {
  const result = await saleService.getAllSales(req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Sales fetched successfully.', result));
});

const getSaleById = asyncHandler(async (req, res) => {
  const result = await saleService.getSaleById(req.params.id, req.tenantId);
  res.status(200).json(new ApiResponse(200, 'Sale details fetched successfully.', result));
});

const createSale = asyncHandler(async (req, res) => {
  const { sale, invoiceNumber } = await saleService.createSale(req.tenantId, req.body, req.user._id, req.ip);
  res.status(201).json(new ApiResponse(201, 'Sale created successfully.', { sale, invoiceNumber }));
});

const processReturn = asyncHandler(async (req, res) => {
  const result = await saleService.processReturn(req.params.id, req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Return processed successfully.', result));
});

const deleteSale = asyncHandler(async (req, res) => {
  await saleService.deleteSale(req.params.id, req.tenantId, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Sale cancelled/deleted successfully.'));
});

const getInvoice = asyncHandler(async (req, res) => {
  const pdfBuffer = await saleService.getInvoice(req.params.id, req.tenantId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="invoice-${req.params.id}.pdf"`);
  res.status(200).send(pdfBuffer);
});

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  processReturn,
  deleteSale,
  getInvoice,
};
