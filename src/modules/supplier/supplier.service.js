const supplierRepository = require('./supplier.repository');
const ApiError = require('../../utils/apiError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getPagination, getPaginationMeta, getSort } = require('../../utils/queryHelper');
const inventoryService = require('../inventory/inventory.service');
const Settings = require('../setting/setting.model');

class SupplierService {
  // ─── SUPPLIERS ─────────────────────────────────────────────────────────────
  async getAllSuppliers(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const sort = getSort(query, ['name', 'createdAt']);
    const filter = {};
    if (query.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { contactPerson: { $regex: query.q, $options: 'i' } },
        { phone: { $regex: query.q, $options: 'i' } },
      ];
    }
    const [suppliers, total] = await Promise.all([
      supplierRepository.findAllSuppliers({ tenantId, filter, skip, limit, sort }),
      supplierRepository.countSuppliers({ tenantId, filter }),
    ]);
    return { suppliers, pagination: getPaginationMeta(total, page, limit) };
  }

  async getSupplierById(id, tenantId) {
    const supplier = await supplierRepository.findSupplierById(id, tenantId);
    if (!supplier) throw new ApiError(404, 'Supplier not found.');
    return supplier;
  }

  async createSupplier(tenantId, data, userId, ip) {
    const supplier = await supplierRepository.createSupplier({ ...data, tenantId });
    await createAuditLog({
      userId,
      tenantId,
      action: 'create',
      module: 'suppliers',
      details: { supplierId: supplier._id, name: supplier.name },
      ipAddress: ip,
    });
    return supplier;
  }

  async updateSupplier(id, tenantId, data, userId, ip) {
    const supplier = await supplierRepository.updateSupplier(id, tenantId, data);
    if (!supplier) throw new ApiError(404, 'Supplier not found.');
    await createAuditLog({
      userId,
      tenantId,
      action: 'update',
      module: 'suppliers',
      details: { supplierId: id, name: supplier.name },
      ipAddress: ip,
    });
    return supplier;
  }

  async deleteSupplier(id, tenantId, userId, ip) {
    const supplier = await supplierRepository.deleteSupplier(id, tenantId);
    if (!supplier) throw new ApiError(404, 'Supplier not found.');
    await createAuditLog({
      userId,
      tenantId,
      action: 'delete',
      module: 'suppliers',
      details: { supplierId: id, name: supplier.name },
      ipAddress: ip,
    });
    return true;
  }

  // ─── PURCHASE ORDERS ────────────────────────────────────────────────────────
  async getAllPOs(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const sort = getSort(query, ['createdAt', 'totalAmount']);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.supplier) filter.supplier = query.supplier;
    if (query.poNumber) filter.poNumber = { $regex: query.poNumber, $options: 'i' };

    const [pos, total] = await Promise.all([
      supplierRepository.findAllPOs({ tenantId, filter, skip, limit, sort }),
      supplierRepository.countPOs({ tenantId, filter }),
    ]);
    return { pos, pagination: getPaginationMeta(total, page, limit) };
  }

  async getPOById(id, tenantId) {
    const po = await supplierRepository.findPOById(id, tenantId);
    if (!po) throw new ApiError(404, 'Purchase order not found.');
    return po;
  }

  async createPO(tenantId, data, userId, ip) {
    const { supplierId, items, notes, expectedDeliveryDate } = data;
    if (!items || items.length === 0) throw new ApiError(400, 'At least one item is required in PO.');

    const supplier = await supplierRepository.findSupplierById(supplierId, tenantId);
    if (!supplier) throw new ApiError(404, 'Supplier not found.');

    const settings = await Settings.findOne({ tenantId });
    const prefix = (settings && settings.purchaseOrderPrefix) || 'PO';
    const poNumber = await supplierRepository.getNextPONumber(tenantId, prefix);

    let totalAmount = 0;
    const poItems = items.map((item) => {
      const lineCost = item.unitCost * item.quantity;
      totalAmount += lineCost;
      return {
        product: item.productId,
        productName: item.productName,
        variantId: item.variantId || null,
        variantLabel: item.variantLabel || '',
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: lineCost,
      };
    });

    const po = await supplierRepository.createPO({
      poNumber,
      supplier: supplierId,
      items: poItems,
      totalAmount,
      notes,
      expectedDeliveryDate,
      createdBy: userId,
      tenantId,
      status: 'draft',
    });

    await createAuditLog({
      userId,
      tenantId,
      action: 'create',
      module: 'purchaseOrders',
      details: { poId: po._id, poNumber, totalAmount },
      ipAddress: ip,
    });

    return po;
  }

  async updatePOStatus(id, tenantId, { status }, userId, ip) {
    const po = await supplierRepository.findPOById(id, tenantId);
    if (!po) throw new ApiError(404, 'Purchase Order not found.');

    if (po.status === 'received' || po.status === 'cancelled') {
      throw new ApiError(400, `Cannot update status of a ${po.status} PO.`);
    }

    const updated = await supplierRepository.updatePO(id, tenantId, { status });

    await createAuditLog({
      userId,
      tenantId,
      action: 'update_status',
      module: 'purchaseOrders',
      details: { poId: id, oldStatus: po.status, newStatus: status },
      ipAddress: ip,
    });

    return updated;
  }

  async receivePOItems(id, tenantId, { itemsReceived }, userId, ip) {
    const po = await supplierRepository.findPOById(id, tenantId);
    if (!po) throw new ApiError(404, 'Purchase Order not found.');

    if (po.status === 'received' || po.status === 'cancelled') {
      throw new ApiError(400, `Cannot receive items on a ${po.status} PO.`);
    }

    let changed = false;

    for (const recItem of itemsReceived) {
      const poItem = po.items.id(recItem.itemId);
      if (!poItem) continue;

      const remaining = poItem.quantity - poItem.receivedQuantity;
      if (recItem.quantity > remaining) {
        throw new ApiError(400, `Cannot receive more than remaining units (${remaining}) for item ${poItem.productName}.`);
      }

      poItem.receivedQuantity += recItem.quantity;
      if (recItem.imeiList && recItem.imeiList.length > 0) {
        poItem.imeiList.push(...recItem.imeiList);
      }
      changed = true;

      // Automatically Stock In to Inventory
      try {
        await inventoryService.stockIn(
          tenantId,
          {
            productId: poItem.product,
            variantId: poItem.variantId,
            quantity: recItem.quantity,
            reason: `Purchase Order receipt ${po.poNumber}`,
            imeiList: recItem.imeiList || [],
            referenceId: po._id,
            referenceModel: 'PurchaseOrder',
          },
          userId
        );
      } catch (err) {
        // If inventory record doesn't exist, we skip or let it throw.
        // It's safer to let it fail or log so the admin knows.
        throw new ApiError(400, `Inventory stock-in failed for ${poItem.productName}: ${err.message}`);
      }
    }

    if (!changed) throw new ApiError(400, 'No valid items received.');

    // Recalculate status
    const allReceived = po.items.every((it) => it.receivedQuantity >= it.quantity);
    const someReceived = po.items.some((it) => it.receivedQuantity > 0);

    po.status = allReceived ? 'received' : someReceived ? 'partially_received' : po.status;
    if (po.status === 'received') {
      po.receivedAt = new Date();
    }

    await po.save();

    await createAuditLog({
      userId,
      tenantId,
      action: 'receive_items',
      module: 'purchaseOrders',
      details: { poId: id, status: po.status, receivedItems: itemsReceived },
      ipAddress: ip,
    });

    return po;
  }
}

module.exports = new SupplierService();
