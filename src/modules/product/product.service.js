const productRepository = require('./product.repository');
const ApiError = require('../../utils/apiError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getPagination, getPaginationMeta, getSort } = require('../../utils/queryHelper');
const Inventory = require('../inventory/inventory.model');

class ProductService {
  // ─── CATEGORIES ──────────────────────────────────────────────────────────
  async getAllCategories(tenantId) { return productRepository.findAllCategories(tenantId); }
  async createCategory(tenantId, data, userId, ip) {
    const cat = await productRepository.createCategory({ ...data, tenantId });
    await createAuditLog({ userId, tenantId, action: 'create', module: 'categories', details: { name: cat.name }, ipAddress: ip });
    return cat;
  }
  async updateCategory(id, tenantId, data, userId, ip) {
    const cat = await productRepository.updateCategory(id, tenantId, data);
    if (!cat) throw new ApiError(404, 'Category not found.');
    await createAuditLog({ userId, tenantId, action: 'update', module: 'categories', details: { id }, ipAddress: ip });
    return cat;
  }
  async deleteCategory(id, tenantId, userId, ip) {
    const cat = await productRepository.deleteCategory(id, tenantId);
    if (!cat) throw new ApiError(404, 'Category not found.');
    await createAuditLog({ userId, tenantId, action: 'delete', module: 'categories', details: { id }, ipAddress: ip });
    return true;
  }

  // ─── BRANDS ───────────────────────────────────────────────────────────────
  async getAllBrands(tenantId) { return productRepository.findAllBrands(tenantId); }
  async createBrand(tenantId, data, userId, ip) {
    const brand = await productRepository.createBrand({ ...data, tenantId });
    await createAuditLog({ userId, tenantId, action: 'create', module: 'brands', details: { name: brand.name }, ipAddress: ip });
    return brand;
  }
  async updateBrand(id, tenantId, data, userId, ip) {
    const brand = await productRepository.updateBrand(id, tenantId, data);
    if (!brand) throw new ApiError(404, 'Brand not found.');
    return brand;
  }
  async deleteBrand(id, tenantId, userId, ip) {
    const brand = await productRepository.deleteBrand(id, tenantId);
    if (!brand) throw new ApiError(404, 'Brand not found.');
    return true;
  }

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────
  async getAllProducts(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const sort = getSort(query, ['name', 'createdAt']);
    const filter = {};
    if (query.category) filter.category = query.category;
    if (query.brand) filter.brand = query.brand;
    if (query.productType) filter.productType = query.productType;
    if (query.hasIMEI !== undefined) filter.hasIMEI = query.hasIMEI === 'true';
    const [products, total] = await Promise.all([
      productRepository.findAll({ tenantId, filter, skip, limit, sort }),
      productRepository.count({ tenantId, filter }),
    ]);
    return { products, pagination: getPaginationMeta(total, page, limit) };
  }

  async searchProducts(tenantId, q, limit) {
    if (!q || q.trim().length < 2) throw new ApiError(400, 'Search query must be at least 2 characters.');
    return productRepository.searchProducts(tenantId, q.trim(), parseInt(limit) || 10);
  }

  async getProductById(id, tenantId) {
    const product = await productRepository.findById(id, tenantId);
    if (!product) throw new ApiError(404, 'Product not found.');
    return product;
  }

  async getProductByBarcode(barcode, tenantId) {
    const product = await productRepository.findByBarcode(barcode, tenantId);
    if (!product) throw new ApiError(404, 'Product not found with this barcode.');
    return product;
  }

  async createProduct(tenantId, data, files, userId, ip) {
    const images = [];
    if (files && files.length > 0) {
      for (const file of files) {
        images.push({ url: `/uploads/${file.filename}`, publicId: file.filename });
      }
    }
    const product = await productRepository.create({ ...data, images, tenantId });

    // Auto-create inventory record for each variant (or base)
    if (product.variants && product.variants.length > 0) {
      await Promise.all(product.variants.map((v) =>
        Inventory.create({ product: product._id, variantId: v._id, quantity: 0, tenantId })
      ));
    } else {
      await Inventory.create({ product: product._id, quantity: 0, tenantId });
    }

    await createAuditLog({ userId, tenantId, action: 'create', module: 'products', details: { productId: product._id, name: product.name }, ipAddress: ip });
    return product;
  }

  async updateProduct(id, tenantId, data, userId, ip) {
    const product = await productRepository.update(id, tenantId, data);
    if (!product) throw new ApiError(404, 'Product not found.');
    await createAuditLog({ userId, tenantId, action: 'update', module: 'products', details: { productId: id }, ipAddress: ip });
    return product;
  }

  async deleteProduct(id, tenantId, userId, ip) {
    const product = await productRepository.softDelete(id, tenantId);
    if (!product) throw new ApiError(404, 'Product not found.');
    await createAuditLog({ userId, tenantId, action: 'delete', module: 'products', details: { productId: id }, ipAddress: ip });
    return true;
  }
}

module.exports = new ProductService();
