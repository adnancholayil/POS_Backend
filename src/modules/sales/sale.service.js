const saleRepository = require('./sale.repository');
const ApiError = require('../../utils/apiError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getPagination, getPaginationMeta, getSort, getDateRangeFilter } = require('../../utils/queryHelper');
const inventoryService = require('../inventory/inventory.service');
const Customer = require('../customer/customer.model');
const Warranty = require('./warranty.model');
const Settings = require('../setting/setting.model');
const { generateInvoicePDF } = require('../../utils/pdf');
const { sendEmail } = require('../../config/mailer');
const { emitToTenant } = require('../../config/socket');

class SaleService {
  async getAllSales(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const sort = getSort(query, ['createdAt', 'totalAmount', 'invoiceNumber']);
    const filter = { ...getDateRangeFilter(query) };
    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.salesman) filter.salesman = query.salesman;
    if (query.customer) filter.customer = query.customer;
    const [sales, total] = await Promise.all([
      saleRepository.findAll({ tenantId, filter, skip, limit, sort }),
      saleRepository.count({ tenantId, filter }),
    ]);
    return { sales, pagination: getPaginationMeta(total, page, limit) };
  }

  async getSaleById(id, tenantId) {
    const sale = await saleRepository.findById(id, tenantId);
    if (!sale) throw new ApiError(404, 'Sale not found.');
    const items = await saleRepository.findItemsBySale(id);
    return { sale, items };
  }

  async createSale(tenantId, data, userId, ip) {
    const { items, customerId, customerName, paymentMethod, paymentStatus, discountAmount = 0, notes, isGSTInvoice, paidAmount } = data;
    if (!items || items.length === 0) throw new ApiError(400, 'Sale must have at least one item.');

    const settings = await Settings.findOne({ tenantId });
    const prefix = (settings && settings.invoicePrefix) || 'INV';
    const invoiceNumber = await saleRepository.getNextInvoiceNumber(tenantId, prefix);

    let subTotal = 0, taxAmount = 0;
    const saleItemsData = [];

    for (const item of items) {
      const lineSubTotal = item.unitPrice * item.quantity;
      const lineDiscount = item.discountAmount || 0;
      const lineTax = item.taxAmount !== undefined ? item.taxAmount : (lineSubTotal * (item.taxRate || 0)) / 100;
      const lineTotal = item.totalPrice !== undefined ? item.totalPrice : lineSubTotal + lineTax - lineDiscount;

      subTotal += lineSubTotal;
      taxAmount += lineTax;

      saleItemsData.push({
        product: item.productId,
        productName: item.productName,
        variantId: item.variantId || null,
        variantLabel: item.variantLabel || '',
        imei: item.imei || null,
        quantity: item.quantity,
        costPrice: item.costPrice || 0,
        unitPrice: item.unitPrice,
        discountAmount: lineDiscount,
        taxRate: item.taxRate || 0,
        taxAmount: lineTax,
        totalPrice: lineTotal,
        tenantId,
      });
    }

    const totalAmount = subTotal + taxAmount - discountAmount;

    // Create sale header
    const sale = await saleRepository.create({
      invoiceNumber,
      customer: customerId || null,
      customerName: customerName || 'Walk-In Customer',
      salesman: userId,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentStatus || 'paid',
      subTotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paidAmount: paidAmount || totalAmount,
      isGSTInvoice: !!isGSTInvoice,
      notes,
      tenantId,
    });

    // Attach saleId to items and insert
    const itemsWithSale = saleItemsData.map((it) => ({ ...it, sale: sale._id }));
    await saleRepository.createItems(itemsWithSale);

    // Deduct inventory
    for (const item of items) {
      try {
        await inventoryService.stockOut(tenantId, {
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          reason: `Sale ${invoiceNumber}`,
          imeiList: item.imei ? [item.imei] : [],
          referenceId: sale._id,
          referenceModel: 'Sale',
        }, userId);
      } catch (invErr) {
        // Log but don't block sale — inventory might be managed externally
      }
    }

    // Create warranties
    const productModule = require('../product/product.model');
    for (const item of items) {
      const product = await productModule.findById(item.productId).select('warrantyMonths name');
      if (product && product.warrantyMonths > 0) {
        const start = new Date();
        const end = new Date(start);
        end.setMonth(end.getMonth() + product.warrantyMonths);
        await Warranty.create({
          sale: sale._id,
          product: item.productId,
          productName: item.productName,
          customer: customerId || null,
          customerName: customerName || 'Walk-In',
          imei: item.imei || null,
          durationMonths: product.warrantyMonths,
          startDate: start,
          endDate: end,
          tenantId,
        });
      }
    }

    // Update customer stats
    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalPurchases: 1, totalSpent: totalAmount },
      });
    }

    // Generate PDF invoice
    let customerInfo = {};
    if (customerId) {
      const cust = await Customer.findById(customerId).lean();
      if (cust) { customerInfo = { customerPhone: cust.phone, customerGSTIN: cust.gstin }; }
    }

    const invoiceData = {
      invoiceNumber, createdAt: sale.createdAt,
      shopName: settings?.shopName, shopAddress: settings?.shopAddress, shopGSTIN: settings?.gstNumber,
      customerName: customerName || 'Walk-In Customer',
      ...customerInfo,
      items: saleItemsData.map((it, i) => ({ ...it, productName: items[i].productName, variantLabel: items[i].variantLabel })),
      subTotal, discountAmount, taxAmount, totalAmount,
    };

    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Email invoice if customer has email
    if (customerId) {
      const cust = await Customer.findById(customerId).select('email');
      if (cust && cust.email) {
        try {
          await sendEmail({
            to: cust.email,
            subject: `Invoice ${invoiceNumber} from ${settings?.shopName || 'Shop'}`,
            html: `<p>Thank you for your purchase. Please find your invoice attached.</p>`,
          });
        } catch (_) {}
      }
    }

    // Socket notification
    try {
      emitToTenant(tenantId.toString(), 'new_sale', { invoiceNumber, totalAmount, salesman: userId });
    } catch (_) {}

    await createAuditLog({ userId, tenantId, action: 'sale', module: 'sales', details: { saleId: sale._id, invoiceNumber, totalAmount }, ipAddress: ip });

    return { sale, invoiceNumber, pdfBuffer };
  }

  async processReturn(saleId, tenantId, { itemId, quantity, reason }, userId, ip) {
    const sale = await saleRepository.findById(saleId, tenantId);
    if (!sale) throw new ApiError(404, 'Sale not found.');
    if (sale.status === 'returned') throw new ApiError(400, 'Sale already fully returned.');

    const saleItem = await saleRepository.findItemById(itemId);
    if (!saleItem || saleItem.sale.toString() !== saleId) throw new ApiError(404, 'Sale item not found.');
    const returnable = saleItem.quantity - saleItem.returnedQuantity;
    if (quantity > returnable) throw new ApiError(400, `Can only return up to ${returnable} units.`);

    saleItem.returnedQuantity += quantity;
    if (saleItem.returnedQuantity >= saleItem.quantity) saleItem.isReturned = true;
    await saleItem.save();

    // Restock
    try {
      await inventoryService.stockIn(tenantId, {
        productId: saleItem.product, variantId: saleItem.variantId,
        quantity, reason: `Return for sale ${sale.invoiceNumber}: ${reason}`,
        imeiList: saleItem.imei ? [saleItem.imei] : [],
        referenceId: sale._id, referenceModel: 'Sale',
      }, userId);
    } catch (_) {}

    // Update sale status
    const allItems = await saleRepository.findItemsBySale(saleId);
    const allReturned = allItems.every((i) => i.returnedQuantity >= i.quantity);
    const anyReturned = allItems.some((i) => i.returnedQuantity > 0);
    const newStatus = allReturned ? 'returned' : anyReturned ? 'partially_returned' : sale.status;
    await saleRepository.update(saleId, tenantId, { status: newStatus });

    await createAuditLog({ userId, tenantId, action: 'update', module: 'sales', details: { saleId, returnedItem: itemId, quantity, reason }, ipAddress: ip });
    return { success: true, status: newStatus };
  }

  async deleteSale(id, tenantId, userId, ip) {
    const sale = await saleRepository.findById(id, tenantId);
    if (!sale) throw new ApiError(404, 'Sale not found.');
    if (sale.status === 'completed') throw new ApiError(400, 'Completed sales cannot be deleted. Process a return instead.');
    await saleRepository.update(id, tenantId, { status: 'cancelled' });
    await createAuditLog({ userId, tenantId, action: 'delete', module: 'sales', details: { saleId: id }, ipAddress: ip });
    return true;
  }

  async getInvoice(id, tenantId) {
    const { sale, items } = await this.getSaleById(id, tenantId);
    const settings = await Settings.findOne({ tenantId }).lean();
    let customerInfo = {};
    if (sale.customer) {
      const cust = await Customer.findById(sale.customer).lean();
      if (cust) customerInfo = { customerPhone: cust.phone, customerGSTIN: cust.gstin };
    }
    const invoiceData = {
      invoiceNumber: sale.invoiceNumber, createdAt: sale.createdAt,
      shopName: settings?.shopName, shopAddress: settings?.shopAddress, shopGSTIN: settings?.gstNumber,
      customerName: sale.customerName, ...customerInfo,
      items, subTotal: sale.subTotal, discountAmount: sale.discountAmount,
      taxAmount: sale.taxAmount, totalAmount: sale.totalAmount,
    };
    return generateInvoicePDF(invoiceData);
  }
}

module.exports = new SaleService();
