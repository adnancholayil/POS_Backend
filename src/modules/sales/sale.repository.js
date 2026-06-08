const Sale = require('./sale.model');
const SaleItem = require('./saleItem.model');

class SaleRepository {
  async findAll({ tenantId, filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } }) {
    return Sale.find({ tenantId, ...filter })
      .populate('customer', 'name phone')
      .populate('salesman', 'name email')
      .sort(sort).skip(skip).limit(limit).lean();
  }
  async count({ tenantId, filter = {} }) { return Sale.countDocuments({ tenantId, ...filter }); }
  async findById(id, tenantId) {
    return Sale.findOne({ _id: id, tenantId })
      .populate('customer', 'name phone email gstin')
      .populate('salesman', 'name email');
  }
  async findByInvoiceNumber(invoiceNumber, tenantId) { return Sale.findOne({ invoiceNumber, tenantId }); }
  async create(data) { return Sale.create(data); }
  async update(id, tenantId, data) { return Sale.findOneAndUpdate({ _id: id, tenantId }, data, { new: true }); }
  async createItems(items) { return SaleItem.insertMany(items); }
  async findItemsBySale(saleId) { return SaleItem.find({ sale: saleId }).lean(); }
  async findItemById(id) { return SaleItem.findById(id); }
  async updateItem(id, data) { return SaleItem.findByIdAndUpdate(id, data, { new: true }); }
  async getNextInvoiceNumber(tenantId, prefix) {
    const lastSale = await Sale.findOne({ tenantId }).sort({ createdAt: -1 }).select('invoiceNumber');
    if (!lastSale) return `${prefix}0001`;
    const lastNum = parseInt(lastSale.invoiceNumber.replace(prefix, '')) || 0;
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
  }
}

module.exports = new SaleRepository();
