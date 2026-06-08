const express = require('express');
const router = express.Router();
const c = require('./product.controller');
const { protect, hasPermission, authorize } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

router.use(protect);

// Categories
router.get('/categories', c.getAllCategories);
router.post('/categories', hasPermission('products:create'), c.createCategory);
router.patch('/categories/:id', hasPermission('products:update'), c.updateCategory);
router.delete('/categories/:id', hasPermission('products:delete'), c.deleteCategory);

// Brands
router.get('/brands', c.getAllBrands);
router.post('/brands', hasPermission('products:create'), c.createBrand);
router.patch('/brands/:id', hasPermission('products:update'), c.updateBrand);
router.delete('/brands/:id', hasPermission('products:delete'), c.deleteBrand);

// Products
router.get('/search', hasPermission('products:read'), c.searchProducts);
router.get('/barcode/:barcode', hasPermission('products:read'), c.getProductByBarcode);
router.get('/', hasPermission('products:read'), c.getAllProducts);
router.get('/:id', hasPermission('products:read'), c.getProductById);
router.post('/', hasPermission('products:create'), upload.array('images', 5), c.createProduct);
router.patch('/:id', hasPermission('products:update'), c.updateProduct);
router.delete('/:id', hasPermission('products:delete'), c.deleteProduct);

module.exports = router;
