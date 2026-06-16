const Inventory = require('./inventory.model');
const InventoryMovement = require('./inventoryMovement.model');

class InventoryRepository {
  async findAll({ tenantId, filter = {}, skip = 0, limit = 10, sort = {} }) {
    return Inventory.find({ tenantId, ...filter })
      .populate('product', 'name sku barcode hasIMEI productType')
      .sort(sort).skip(skip).limit(limit).lean();
  }

  async count({ tenantId, filter = {} }) { return Inventory.countDocuments({ tenantId, ...filter }); }

  async findByProductAndVariant(productId, variantId, tenantId) {
    return Inventory.findOne({ product: productId, variantId: variantId || null, tenantId });
  }

  // Upsert: find existing or create a zero-quantity record
  async findOrCreateByProductAndVariant(productId, variantId, tenantId) {
    const filter = { product: productId, variantId: variantId || null, tenantId };
    const update  = { $setOnInsert: { quantity: 0, lowStockThreshold: 5, imeiList: [], location: 'main' } };
    return Inventory.findOneAndUpdate(filter, update, { upsert: true, new: true, setDefaultsOnInsert: true });
  }

  async findLowStock(tenantId) {
    return Inventory.find({
      tenantId,
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).populate('product', 'name sku').lean();
  }

  async update(id, data) {
    return Inventory.findByIdAndUpdate(id, data, { new: true });
  }

  async createMovement(data) { return InventoryMovement.create(data); }

  async findMovements({ tenantId, filter = {}, skip = 0, limit = 20 }) {
    return InventoryMovement.find({ tenantId, ...filter })
      .populate('product', 'name sku')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  }

  async countMovements({ tenantId, filter = {} }) {
    return InventoryMovement.countDocuments({ tenantId, ...filter });
  }
}

module.exports = new InventoryRepository();
