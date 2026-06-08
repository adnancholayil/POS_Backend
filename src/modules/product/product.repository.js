const Product = require('./product.model');
const Category = require('./category.model');
const Brand = require('./brand.model');

class ProductRepository {
  // ─── CATEGORIES ───────────────────────────────────────────────────────────
  async findAllCategories(tenantId) { return Category.find({ tenantId, isActive: true }).sort({ name: 1 }); }
  async findCategoryById(id, tenantId) { return Category.findOne({ _id: id, tenantId }); }
  async createCategory(data) { return Category.create(data); }
  async updateCategory(id, tenantId, data) { return Category.findOneAndUpdate({ _id: id, tenantId }, data, { new: true }); }
  async deleteCategory(id, tenantId) { return Category.findOneAndDelete({ _id: id, tenantId }); }

  // ─── BRANDS ───────────────────────────────────────────────────────────────
  async findAllBrands(tenantId) { return Brand.find({ tenantId, isActive: true }).sort({ name: 1 }); }
  async findBrandById(id, tenantId) { return Brand.findOne({ _id: id, tenantId }); }
  async createBrand(data) { return Brand.create(data); }
  async updateBrand(id, tenantId, data) { return Brand.findOneAndUpdate({ _id: id, tenantId }, data, { new: true }); }
  async deleteBrand(id, tenantId) { return Brand.findOneAndDelete({ _id: id, tenantId }); }

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────
  async findAll({ tenantId, filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } }) {
    return Product.find({ tenantId, isActive: true, ...filter })
      .populate('category', 'name').populate('brand', 'name')
      .sort(sort).skip(skip).limit(limit).lean();
  }

  async count({ tenantId, filter = {} }) { return Product.countDocuments({ tenantId, isActive: true, ...filter }); }

  async findById(id, tenantId) {
    return Product.findOne({ _id: id, tenantId }).populate('category', 'name').populate('brand', 'name');
  }

  async findByBarcode(barcode, tenantId) {
    return Product.findOne({ barcode, tenantId, isActive: true }).populate('category', 'name').populate('brand', 'name');
  }

  async create(data) { return Product.create(data); }

  async update(id, tenantId, data) {
    return Product.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true })
      .populate('category', 'name').populate('brand', 'name');
  }

  async softDelete(id, tenantId) {
    return Product.findOneAndUpdate({ _id: id, tenantId }, { isActive: false }, { new: true });
  }

  async searchProducts(tenantId, searchText, limit = 10) {
    return Product.find({
      tenantId, isActive: true,
      $text: { $search: searchText },
    }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .populate('category', 'name').populate('brand', 'name')
      .lean();
  }
}

module.exports = new ProductRepository();
