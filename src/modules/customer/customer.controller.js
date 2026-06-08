const customerService = require('./customer.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getAllCustomers = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Customers fetched.', await customerService.getAllCustomers(req.tenantId, req.query))); });
const getCustomerById = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Customer fetched.', await customerService.getCustomerById(req.params.id, req.tenantId))); });
const getCustomerHistory = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Customer history fetched.', await customerService.getCustomerHistory(req.params.id, req.tenantId))); });
const searchCustomers = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Search results.', await customerService.searchCustomers(req.tenantId, req.query.q, req.query.limit))); });
const createCustomer = asyncHandler(async (req, res) => { res.status(201).json(new ApiResponse(201, 'Customer created.', await customerService.createCustomer(req.tenantId, req.body, req.user._id, req.ip))); });
const updateCustomer = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Customer updated.', await customerService.updateCustomer(req.params.id, req.tenantId, req.body, req.user._id, req.ip))); });
const deleteCustomer = asyncHandler(async (req, res) => { await customerService.deleteCustomer(req.params.id, req.tenantId, req.user._id, req.ip); res.status(200).json(new ApiResponse(200, 'Customer deleted.')); });

module.exports = { getAllCustomers, getCustomerById, getCustomerHistory, searchCustomers, createCustomer, updateCustomer, deleteCustomer };
