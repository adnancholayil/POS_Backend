const usedDeviceRepository = require('./usedDevice.repository');
const ApiError = require('../../utils/apiError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getPagination, getPaginationMeta, getSort } = require('../../utils/queryHelper');

class UsedDeviceService {
  async getAllUsedDevices(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const sort = getSort(query, ['createdAt', 'buyingPrice', 'sellingPrice', 'status']);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.deviceType) filter.deviceType = query.deviceType;
    if (query.condition) filter.condition = query.condition;
    if (query.q) {
      filter.$or = [
        { deviceModel: { $regex: query.q, $options: 'i' } },
        { serialOrImei: { $regex: query.q, $options: 'i' } },
        { sourcedFromName: { $regex: query.q, $options: 'i' } },
      ];
    }

    const [devices, total] = await Promise.all([
      usedDeviceRepository.findAll({ tenantId, filter, skip, limit, sort }),
      usedDeviceRepository.count({ tenantId, filter }),
    ]);

    return { devices, pagination: getPaginationMeta(total, page, limit) };
  }

  async getUsedDeviceById(id, tenantId) {
    const device = await usedDeviceRepository.findById(id, tenantId);
    if (!device) throw new ApiError(404, 'Used device not found.');
    return device;
  }

  async buybackDevice(tenantId, data, userId, ip) {
    const device = await usedDeviceRepository.create({
      ...data,
      status: 'purchased',
      tenantId,
    });

    await createAuditLog({
      userId,
      tenantId,
      action: 'create',
      module: 'usedDevice',
      details: { deviceId: device._id, deviceModel: device.deviceModel, buyingPrice: device.buyingPrice },
      ipAddress: ip,
    });

    return device;
  }

  async updateDeviceStatus(id, tenantId, { status, evaluationNotes, sellingPrice }, userId, ip) {
    const device = await usedDeviceRepository.findById(id, tenantId);
    if (!device) throw new ApiError(404, 'Used device not found.');

    const updateFields = { status };
    if (evaluationNotes !== undefined) updateFields.evaluationNotes = evaluationNotes;
    if (sellingPrice !== undefined) updateFields.sellingPrice = sellingPrice;

    if (status === 'sold') {
      updateFields.soldAt = new Date();
    }

    const updated = await usedDeviceRepository.update(id, tenantId, updateFields);

    await createAuditLog({
      userId,
      tenantId,
      action: 'update_status',
      module: 'usedDevice',
      details: { deviceId: id, oldStatus: device.status, newStatus: status },
      ipAddress: ip,
    });

    return updated;
  }

  async resellDevice(id, tenantId, { soldTo, soldVia, sellingPrice }, userId, ip) {
    const device = await usedDeviceRepository.findById(id, tenantId);
    if (!device) throw new ApiError(404, 'Used device not found.');
    if (device.status === 'sold') throw new ApiError(400, 'Device already sold.');

    const updated = await usedDeviceRepository.update(id, tenantId, {
      status: 'sold',
      soldTo,
      soldVia,
      sellingPrice,
      soldAt: new Date(),
    });

    await createAuditLog({
      userId,
      tenantId,
      action: 'resell',
      module: 'usedDevice',
      details: { deviceId: id, soldTo, soldVia, sellingPrice },
      ipAddress: ip,
    });

    return updated;
  }

  async deleteDevice(id, tenantId, userId, ip) {
    const device = await usedDeviceRepository.findById(id, tenantId);
    if (!device) throw new ApiError(404, 'Used device not found.');
    if (device.status === 'sold') throw new ApiError(400, 'Sold devices cannot be deleted.');

    await usedDeviceRepository.delete(id, tenantId);

    await createAuditLog({
      userId,
      tenantId,
      action: 'delete',
      module: 'usedDevice',
      details: { deviceId: id, deviceModel: device.deviceModel },
      ipAddress: ip,
    });

    return true;
  }
}

module.exports = new UsedDeviceService();
