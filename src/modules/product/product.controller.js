const productService = require('./product.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

// Categories
const getAllCategories = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Categories fetched.', await productService.getAllCategories(req.tenantId))); });
const createCategory = asyncHandler(async (req, res) => { res.status(201).json(new ApiResponse(201, 'Category created.', await productService.createCategory(req.tenantId, req.body, req.user._id, req.ip))); });
const updateCategory = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Category updated.', await productService.updateCategory(req.params.id, req.tenantId, req.body, req.user._id, req.ip))); });
const deleteCategory = asyncHandler(async (req, res) => { await productService.deleteCategory(req.params.id, req.tenantId, req.user._id, req.ip); res.status(200).json(new ApiResponse(200, 'Category deleted.')); });

// Brands
const getAllBrands = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Brands fetched.', await productService.getAllBrands(req.tenantId))); });
const createBrand = asyncHandler(async (req, res) => { res.status(201).json(new ApiResponse(201, 'Brand created.', await productService.createBrand(req.tenantId, req.body, req.user._id, req.ip))); });
const updateBrand = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Brand updated.', await productService.updateBrand(req.params.id, req.tenantId, req.body, req.user._id, req.ip))); });
const deleteBrand = asyncHandler(async (req, res) => { await productService.deleteBrand(req.params.id, req.tenantId, req.user._id, req.ip); res.status(200).json(new ApiResponse(200, 'Brand deleted.')); });

// Products
const getAllProducts = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Products fetched.', await productService.getAllProducts(req.tenantId, req.query))); });
const searchProducts = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Search results.', await productService.searchProducts(req.tenantId, req.query.q, req.query.limit))); });
const getProductByBarcode = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Product fetched.', await productService.getProductByBarcode(req.params.barcode, req.tenantId))); });
const getProductById = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Product fetched.', await productService.getProductById(req.params.id, req.tenantId))); });
const createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (typeof data.variants === 'string') data.variants = JSON.parse(data.variants);
  res.status(201).json(new ApiResponse(201, 'Product created.', await productService.createProduct(req.tenantId, data, req.files, req.user._id, req.ip)));
});
const updateProduct = asyncHandler(async (req, res) => { res.status(200).json(new ApiResponse(200, 'Product updated.', await productService.updateProduct(req.params.id, req.tenantId, req.body, req.user._id, req.ip))); });
const deleteProduct = asyncHandler(async (req, res) => { await productService.deleteProduct(req.params.id, req.tenantId, req.user._id, req.ip); res.status(200).json(new ApiResponse(200, 'Product deleted.')); });

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory, getAllBrands, createBrand, updateBrand, deleteBrand, getAllProducts, searchProducts, getProductByBarcode, getProductById, createProduct, updateProduct, deleteProduct };
