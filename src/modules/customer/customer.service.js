const customerRepository = require('./customer.repository');
const ApiError = require('../../utils/apiError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getPagination, getPaginationMeta, getSort } = require('../../utils/queryHelper');
const Sale = require('../sales/sale.model');
const SaleItem = require('../sales/saleItem.model');
const Repair = require('../repair/repair.model');
const Warranty = require('../sales/warranty.model');

class CustomerService {
  async getAllCustomers(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const sort = getSort(query, ['name', 'phone', 'createdAt', 'totalSpent']);
    const filter = {};
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }
    const [customers, total] = await Promise.all([
      customerRepository.findAll({ tenantId, filter, skip, limit, sort }),
      customerRepository.count({ tenantId, filter }),
    ]);
    return { customers, pagination: getPaginationMeta(total, page, limit) };
  }

  async getCustomerById(id, tenantId) {
    const customer = await customerRepository.findById(id, tenantId);
    if (!customer) throw new ApiError(404, 'Customer not found.');
    return customer;
  }

  async getCustomerHistory(id, tenantId) {
    const customer = await customerRepository.findById(id, tenantId);
    if (!customer) throw new ApiError(404, 'Customer not found.');
    const [sales, repairs, warranties] = await Promise.all([
      Sale.find({ customer: id, tenantId }).sort({ createdAt: -1 }).limit(20).lean(),
      Repair.find({ customer: id, tenantId }).sort({ createdAt: -1 }).limit(10).lean(),
      Warranty.find({ customer: id, tenantId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);
    return { customer, sales, repairs, warranties };
  }

  async createCustomer(tenantId, data, userId, ip) {
    const existing = await customerRepository.findByPhone(data.phone, tenantId);
    if (existing) throw new ApiError(409, 'A customer with this phone number already exists.');
    const customer = await customerRepository.create({ ...data, tenantId });
    await createAuditLog({ userId, tenantId, action: 'create', module: 'customers', details: { customerId: customer._id }, ipAddress: ip });
    return customer;
  }

  async updateCustomer(id, tenantId, data, userId, ip) {
    const customer = await customerRepository.update(id, tenantId, data);
    if (!customer) throw new ApiError(404, 'Customer not found.');
    await createAuditLog({ userId, tenantId, action: 'update', module: 'customers', details: { customerId: id }, ipAddress: ip });
    return customer;
  }

  async deleteCustomer(id, tenantId, userId, ip) {
    const customer = await customerRepository.softDelete(id, tenantId);
    if (!customer) throw new ApiError(404, 'Customer not found.');
    await createAuditLog({ userId, tenantId, action: 'delete', module: 'customers', details: { customerId: id }, ipAddress: ip });
    return true;
  }

  async searchCustomers(tenantId, q, limit) {
    if (!q || q.length < 2) throw new ApiError(400, 'Search query must be at least 2 characters.');
    return customerRepository.search(tenantId, q, parseInt(limit) || 10);
  }
}

module.exports = new CustomerService();
