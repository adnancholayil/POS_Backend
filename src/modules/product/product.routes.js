const express = require('express');
const router = express.Router();
const c = require('./product.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

router.use(protect);

// Categories
router.get('/categories', c.getAllCategories);
router.post('/categories', c.createCategory);
router.patch('/categories/:id', c.updateCategory);
router.delete('/categories/:id', c.deleteCategory);

// Brands
router.get('/brands', c.getAllBrands);
router.post('/brands', c.createBrand);
router.patch('/brands/:id', c.updateBrand);
router.delete('/brands/:id', c.deleteBrand);

// Products
router.get('/search', c.searchProducts);
router.get('/barcode/:barcode', c.getProductByBarcode);
router.get('/', c.getAllProducts);
router.get('/:id', c.getProductById);
router.post('/', upload.array('images', 5), c.createProduct);
router.patch('/:id', c.updateProduct);
router.delete('/:id', c.deleteProduct);

module.exports = router;
