const Repair = require('./repair.model');
const RepairLog = require('./repairLog.model');
const RepairPart = require('./repairPart.model');
const Technician = require('./technician.model');

class RepairRepository {
  async findAll({ tenantId, filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } }) {
    return Repair.find({ tenantId, ...filter })
      .populate('customer', 'name phone email')
      .populate('assignedTechnician', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count({ tenantId, filter = {} }) {
    return Repair.countDocuments({ tenantId, ...filter });
  }

  async findById(id, tenantId) {
    return Repair.findOne({ _id: id, tenantId })
      .populate('customer', 'name phone email gstin address')
      .populate('assignedTechnician', 'name email');
  }

  async create(data) {
    return Repair.create(data);
  }

  async update(id, tenantId, data) {
    return Repair.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true })
      .populate('customer', 'name phone')
      .populate('assignedTechnician', 'name');
  }

  async getNextTicketNumber(tenantId, prefix = 'REP') {
    const lastRepair = await Repair.findOne({ tenantId })
      .sort({ createdAt: -1 })
      .select('ticketNumber');
    if (!lastRepair || !lastRepair.ticketNumber) return `${prefix}-1001`;
    
    const parts = lastRepair.ticketNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1]);
    const num = isNaN(lastNum) ? 1000 : lastNum;
    return `${prefix}-${num + 1}`;
  }

  // Logs
  async createLog(data) {
    return RepairLog.create(data);
  }

  async findLogsByRepair(repairId, tenantId) {
    return RepairLog.find({ repair: repairId, tenantId })
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 });
  }

  // Parts
  async createPart(data) {
    return RepairPart.create(data);
  }

  async findPartsByRepair(repairId, tenantId) {
    return RepairPart.find({ repair: repairId, tenantId })
      .populate('addedBy', 'name');
  }

  async removePart(partId, tenantId) {
    return RepairPart.findOneAndDelete({ _id: partId, tenantId });
  }

  async findPartById(partId, tenantId) {
    return RepairPart.findOne({ _id: partId, tenantId });
  }

  // Technicians
  async findTechnicianByUserId(userId, tenantId) {
    return Technician.findOne({ user: userId, tenantId }).populate('user', 'name email');
  }

  async createTechnician(data) {
    return Technician.create(data);
  }

  async updateTechnician(userId, tenantId, data) {
    return Technician.findOneAndUpdate({ user: userId, tenantId }, data, { new: true, runValidators: true });
  }

  async findAllTechnicians(tenantId) {
    return Technician.find({ tenantId }).populate('user', 'name email status');
  }
}

module.exports = new RepairRepository();
