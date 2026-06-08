const repairRepository = require('./repair.repository');
const ApiError = require('../../utils/apiError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getPagination, getPaginationMeta, getSort } = require('../../utils/queryHelper');
const inventoryService = require('../inventory/inventory.service');
const Product = require('../product/product.model');
const Settings = require('../setting/setting.model');
const { emitToTenant } = require('../../config/socket');

class RepairService {
  async getAllRepairs(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const sort = getSort(query, ['createdAt', 'estimatedCost', 'status']);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.assignedTechnician) filter.assignedTechnician = query.assignedTechnician;
    if (query.customer) filter.customer = query.customer;
    if (query.deviceType) filter.deviceType = query.deviceType;
    if (query.q) {
      filter.$or = [
        { ticketNumber: { $regex: query.q, $options: 'i' } },
        { deviceModel: { $regex: query.q, $options: 'i' } },
        { serialOrImei: { $regex: query.q, $options: 'i' } },
      ];
    }

    const [repairs, total] = await Promise.all([
      repairRepository.findAll({ tenantId, filter, skip, limit, sort }),
      repairRepository.count({ tenantId, filter }),
    ]);

    return { repairs, pagination: getPaginationMeta(total, page, limit) };
  }

  async getRepairById(id, tenantId) {
    const repair = await repairRepository.findById(id, tenantId);
    if (!repair) throw new ApiError(404, 'Repair ticket not found.');
    const logs = await repairRepository.findLogsByRepair(id, tenantId);
    const parts = await repairRepository.findPartsByRepair(id, tenantId);
    return { repair, logs, parts };
  }

  async createRepair(tenantId, data, userId, ip) {
    const settings = await Settings.findOne({ tenantId });
    const prefix = (settings && settings.repairPrefix) || 'REP';
    const ticketNumber = await repairRepository.getNextTicketNumber(tenantId, prefix);

    const repair = await repairRepository.create({
      ...data,
      ticketNumber,
      tenantId,
    });

    // Create initial log
    await repairRepository.createLog({
      repair: repair._id,
      status: 'pending',
      notes: 'Repair ticket created.',
      updatedBy: userId,
      tenantId,
    });

    // If technician assigned, increment or adjust technician info
    if (data.assignedTechnician) {
      await repairRepository.updateTechnician(data.assignedTechnician, tenantId, {
        $inc: { totalRepairs: 1 },
      });
    }

    // Socket notification
    try {
      emitToTenant(tenantId.toString(), 'new_repair', { ticketNumber, status: 'pending' });
    } catch (_) {}

    await createAuditLog({
      userId,
      tenantId,
      action: 'create',
      module: 'repairs',
      details: { repairId: repair._id, ticketNumber },
      ipAddress: ip,
    });

    return repair;
  }

  async updateRepair(id, tenantId, data, userId, ip) {
    const repair = await repairRepository.findById(id, tenantId);
    if (!repair) throw new ApiError(404, 'Repair ticket not found.');

    const oldTechnician = repair.assignedTechnician ? repair.assignedTechnician._id.toString() : null;
    const newTechnician = data.assignedTechnician;

    const updatedRepair = await repairRepository.update(id, tenantId, data);

    // Track technician assignment changes
    if (newTechnician && newTechnician !== oldTechnician) {
      await repairRepository.updateTechnician(newTechnician, tenantId, {
        $inc: { totalRepairs: 1 },
      });
    }

    await createAuditLog({
      userId,
      tenantId,
      action: 'update',
      module: 'repairs',
      details: { repairId: id, changes: data },
      ipAddress: ip,
    });

    return updatedRepair;
  }

  async updateStatus(id, tenantId, { status, notes }, userId, ip) {
    const repair = await repairRepository.findById(id, tenantId);
    if (!repair) throw new ApiError(404, 'Repair ticket not found.');

    const oldStatus = repair.status;
    if (oldStatus === status) return repair;

    const updateFields = { status };
    if (status === 'delivered') {
      updateFields.deliveredAt = new Date();
    }

    const updated = await repairRepository.update(id, tenantId, updateFields);

    // Create log
    await repairRepository.createLog({
      repair: id,
      status,
      notes: notes || `Status updated from ${oldStatus} to ${status}.`,
      updatedBy: userId,
      tenantId,
    });

    // Alert / Socket
    try {
      emitToTenant(tenantId.toString(), 'repair_status_change', {
        repairId: id,
        ticketNumber: repair.ticketNumber,
        status,
      });
    } catch (_) {}

    await createAuditLog({
      userId,
      tenantId,
      action: 'update_status',
      module: 'repairs',
      details: { repairId: id, ticketNumber: repair.ticketNumber, oldStatus, newStatus: status },
      ipAddress: ip,
    });

    return updated;
  }

  async addPart(id, tenantId, { productId, quantity }, userId, ip) {
    const repair = await repairRepository.findById(id, tenantId);
    if (!repair) throw new ApiError(404, 'Repair ticket not found.');

    const product = await Product.findOne({ _id: productId, tenantId });
    if (!product) throw new ApiError(404, 'Spare part product not found.');

    const price = product.price || 0;
    const totalPrice = price * quantity;

    // Deduct stock from inventory
    await inventoryService.stockOut(
      tenantId,
      {
        productId,
        quantity,
        reason: `Used in repair ticket ${repair.ticketNumber}`,
        referenceId: repair._id,
        referenceModel: 'Repair',
      },
      userId
    );

    const part = await repairRepository.createPart({
      repair: id,
      product: productId,
      productName: product.name,
      quantity,
      unitPrice: price,
      totalPrice,
      addedBy: userId,
      tenantId,
    });

    // Update actualCost on repair
    repair.actualCost = (repair.actualCost || 0) + totalPrice;
    await repair.save();

    await repairRepository.createLog({
      repair: id,
      status: repair.status,
      notes: `Added spare part: ${product.name} (x${quantity}).`,
      updatedBy: userId,
      tenantId,
    });

    await createAuditLog({
      userId,
      tenantId,
      action: 'add_part',
      module: 'repairs',
      details: { repairId: id, partId: part._id, productId, quantity, totalPrice },
      ipAddress: ip,
    });

    return part;
  }

  async removePart(id, tenantId, partId, userId, ip) {
    const repair = await repairRepository.findById(id, tenantId);
    if (!repair) throw new ApiError(404, 'Repair ticket not found.');

    const part = await repairRepository.findPartById(partId, tenantId);
    if (!part || part.repair.toString() !== id) {
      throw new ApiError(404, 'Repair part not found on this ticket.');
    }

    // Restock the inventory
    if (part.product) {
      await inventoryService.stockIn(
        tenantId,
        {
          productId: part.product,
          quantity: part.quantity,
          reason: `Removed from repair ticket ${repair.ticketNumber}`,
          referenceId: repair._id,
          referenceModel: 'Repair',
        },
        userId
      );
    }

    // Deduct actualCost from repair
    repair.actualCost = Math.max(0, (repair.actualCost || 0) - part.totalPrice);
    await repair.save();

    await repairRepository.removePart(partId, tenantId);

    await repairRepository.createLog({
      repair: id,
      status: repair.status,
      notes: `Removed spare part: ${part.productName}.`,
      updatedBy: userId,
      tenantId,
    });

    await createAuditLog({
      userId,
      tenantId,
      action: 'remove_part',
      module: 'repairs',
      details: { repairId: id, partId, productName: part.productName, quantity: part.quantity },
      ipAddress: ip,
    });

    return true;
  }

  // Technicians
  async getTechnicians(tenantId) {
    return repairRepository.findAllTechnicians(tenantId);
  }

  async updateTechnician(userId, tenantId, data, loggedInUser, ip) {
    let tech = await repairRepository.findTechnicianByUserId(userId, tenantId);
    if (!tech) {
      tech = await repairRepository.createTechnician({
        user: userId,
        tenantId,
        ...data,
      });
    } else {
      tech = await repairRepository.updateTechnician(userId, tenantId, data);
    }

    await createAuditLog({
      userId: loggedInUser,
      tenantId,
      action: 'update_technician',
      module: 'repairs',
      details: { technicianUserId: userId, status: data.status },
      ipAddress: ip,
    });

    return tech;
  }
}

module.exports = new RepairService();
