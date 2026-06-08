const Supplier = require('./supplier.model');
const PurchaseOrder = require('./purchaseOrder.model');

class SupplierRepository {
  // ─── SUPPLIERS ─────────────────────────────────────────────────────────────
  async findAllSuppliers({ tenantId, filter = {}, skip = 0, limit = 10, sort = { name: 1 } }) {
    return Supplier.find({ tenantId, isActive: true, ...filter })
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async countSuppliers({ tenantId, filter = {} }) {
    return Supplier.countDocuments({ tenantId, isActive: true, ...filter });
  }

  async findSupplierById(id, tenantId) {
    return Supplier.findOne({ _id: id, tenantId, isActive: true });
  }

  async createSupplier(data) {
    return Supplier.create(data);
  }

  async updateSupplier(id, tenantId, data) {
    return Supplier.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true });
  }

  async deleteSupplier(id, tenantId) {
    // Soft delete
    return Supplier.findOneAndUpdate({ _id: id, tenantId }, { isActive: false }, { new: true });
  }

  // ─── PURCHASE ORDERS ────────────────────────────────────────────────────────
  async findAllPOs({ tenantId, filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } }) {
    return PurchaseOrder.find({ tenantId, ...filter })
      .populate('supplier', 'name contactPerson phone')
      .populate('createdBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async countPOs({ tenantId, filter = {} }) {
    return PurchaseOrder.countDocuments({ tenantId, ...filter });
  }

  async findPOById(id, tenantId) {
    return PurchaseOrder.findOne({ _id: id, tenantId })
      .populate('supplier', 'name contactPerson phone address gstin')
      .populate('createdBy', 'name')
      .populate('items.product', 'name sku barcode');
  }

  async createPO(data) {
    return PurchaseOrder.create(data);
  }

  async updatePO(id, tenantId, data) {
    return PurchaseOrder.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true })
      .populate('supplier', 'name')
      .populate('createdBy', 'name');
  }

  async getNextPONumber(tenantId, prefix = 'PO') {
    const lastPO = await PurchaseOrder.findOne({ tenantId })
      .sort({ createdAt: -1 })
      .select('poNumber');
    if (!lastPO || !lastPO.poNumber) return `${prefix}-1001`;

    const parts = lastPO.poNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1]);
    const num = isNaN(lastNum) ? 1000 : lastNum;
    return `${prefix}-${num + 1}`;
  }
}

module.exports = new SupplierRepository();
