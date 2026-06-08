const Customer = require('./customer.model');

class CustomerRepository {
  async findAll({ tenantId, filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } }) {
    return Customer.find({ tenantId, isActive: true, ...filter }).sort(sort).skip(skip).limit(limit).lean();
  }
  async count({ tenantId, filter = {} }) { return Customer.countDocuments({ tenantId, isActive: true, ...filter }); }
  async findById(id, tenantId) { return Customer.findOne({ _id: id, tenantId, isActive: true }); }
  async findByPhone(phone, tenantId) { return Customer.findOne({ phone, tenantId }); }
  async create(data) { return Customer.create(data); }
  async update(id, tenantId, data) { return Customer.findOneAndUpdate({ _id: id, tenantId }, data, { new: true }); }
  async softDelete(id, tenantId) { return Customer.findOneAndUpdate({ _id: id, tenantId }, { isActive: false }, { new: true }); }
  async search(tenantId, text, limit = 10) {
    return Customer.find({ tenantId, isActive: true, $text: { $search: text } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } }).limit(limit).lean();
  }
}

module.exports = new CustomerRepository();
