const inventoryRepository = require('./inventory.repository');
const ApiError = require('../../utils/apiError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getPagination, getPaginationMeta, getSort } = require('../../utils/queryHelper');
const { emitToTenant } = require('../../config/socket');

class InventoryService {
  async getAllInventory(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};
    if (query.product) filter.product = query.product;
    if (query.location) filter.location = query.location;
    if (query.lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }
    const [items, total] = await Promise.all([
      inventoryRepository.findAll({ tenantId, filter, skip, limit, sort: { quantity: 1 } }),
      inventoryRepository.count({ tenantId, filter }),
    ]);
    return { items, pagination: getPaginationMeta(total, page, limit) };
  }

  async getLowStockItems(tenantId) {
    return inventoryRepository.findLowStock(tenantId);
  }

  async _adjustStock({ inventory, type, quantity, reason, referenceId, referenceModel, imeiList = [], performedBy, tenantId }) {
    const before = inventory.quantity;
    let after = before;

    if (type === 'stock_in') {
      after = before + quantity;
      if (imeiList.length > 0) {
        inventory.imeiList.push(...imeiList);
      }
    } else if (type === 'stock_out') {
      if (before < quantity) throw new ApiError(400, `Insufficient stock. Available: ${before}`);
      after = before - quantity;
      if (imeiList.length > 0) {
        inventory.imeiList = inventory.imeiList.filter((imei) => !imeiList.includes(imei));
      }
    } else if (type === 'adjustment') {
      after = quantity; // absolute value
    } else if (type === 'return') {
      after = before + quantity;
      if (imeiList.length > 0) inventory.imeiList.push(...imeiList);
    }

    inventory.quantity = after;
    await inventory.save();

    await inventoryRepository.createMovement({
      inventory: inventory._id,
      product: inventory.product,
      variantId: inventory.variantId,
      type,
      quantity: type === 'adjustment' ? quantity - before : quantity,
      quantityBefore: before,
      quantityAfter: after,
      reason,
      referenceId,
      referenceModel,
      imeiList,
      performedBy,
      tenantId,
    });

    // Low stock alert via socket
    if (after <= inventory.lowStockThreshold) {
      try {
        emitToTenant(tenantId.toString(), 'low_stock', {
          inventoryId: inventory._id,
          productId: inventory.product,
          quantity: after,
          threshold: inventory.lowStockThreshold,
        });
      } catch (_) {}
    }

    await createAuditLog({ userId: performedBy, tenantId, action: type === 'stock_in' ? 'stock_in' : 'stock_out', module: 'inventory', details: { inventoryId: inventory._id, type, before, after, reason } });
    return inventory;
  }

  async stockIn(tenantId, { productId, variantId, quantity, reason, imeiList, referenceId, referenceModel }, userId) {
    if (!quantity || quantity <= 0) throw new ApiError(400, 'Quantity must be a positive number.');
    const inv = await inventoryRepository.findByProductAndVariant(productId, variantId, tenantId);
    if (!inv) throw new ApiError(404, 'Inventory record not found for this product/variant.');
    return this._adjustStock({ inventory: inv, type: 'stock_in', quantity, reason, imeiList, referenceId, referenceModel, performedBy: userId, tenantId });
  }

  async stockOut(tenantId, { productId, variantId, quantity, reason, imeiList, referenceId, referenceModel }, userId) {
    if (!quantity || quantity <= 0) throw new ApiError(400, 'Quantity must be a positive number.');
    const inv = await inventoryRepository.findByProductAndVariant(productId, variantId, tenantId);
    if (!inv) throw new ApiError(404, 'Inventory record not found for this product/variant.');
    return this._adjustStock({ inventory: inv, type: 'stock_out', quantity, reason, imeiList, referenceId, referenceModel, performedBy: userId, tenantId });
  }

  async adjustStock(tenantId, { productId, variantId, quantity, reason }, userId) {
    if (quantity === undefined || quantity < 0) throw new ApiError(400, 'Quantity must be >= 0 for adjustment.');
    const inv = await inventoryRepository.findByProductAndVariant(productId, variantId, tenantId);
    if (!inv) throw new ApiError(404, 'Inventory record not found.');
    return this._adjustStock({ inventory: inv, type: 'adjustment', quantity, reason, performedBy: userId, tenantId });
  }

  async getHistory(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};
    if (query.product) filter.product = query.product;
    if (query.type) filter.type = query.type;
    const [movements, total] = await Promise.all([
      inventoryRepository.findMovements({ tenantId, filter, skip, limit }),
      inventoryRepository.countMovements({ tenantId, filter }),
    ]);
    return { movements, pagination: getPaginationMeta(total, page, limit) };
  }

  async updateThreshold(tenantId, productId, variantId, threshold) {
    const inv = await inventoryRepository.findByProductAndVariant(productId, variantId, tenantId);
    if (!inv) throw new ApiError(404, 'Inventory record not found.');
    return inventoryRepository.update(inv._id, { lowStockThreshold: threshold });
  }
}

module.exports = new InventoryService();
