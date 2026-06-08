const mongoose = require('mongoose');
const Sale = require('../sales/sale.model');
const SaleItem = require('../sales/saleItem.model');
const Inventory = require('../inventory/inventory.model');
const Repair = require('../repair/repair.model');
const Product = require('../product/product.model');
const User = require('../user/user.model');

class ReportService {
  async getOverviewStats(tenantId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      salesStats,
      pendingRepairs,
      lowStockCount,
      totalProducts
    ] = await Promise.all([
      // Sales stats for today
      Sale.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), status: { $ne: 'cancelled' }, createdAt: { $gte: today } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      // Pending Repairs count
      Repair.countDocuments({ tenantId, status: { $in: ['pending', 'diagnosing', 'awaiting_parts', 'repairing'] } }),
      // Low stock count
      Inventory.countDocuments({ tenantId, $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }),
      // Total products
      Product.countDocuments({ tenantId, isActive: true })
    ]);

    // Calculate total profit from SaleItems sold today
    const profitStats = await SaleItem.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), createdAt: { $gte: today } } },
      { $project: {
          netQty: { $subtract: ['$quantity', '$returnedQuantity'] },
          costPrice: 1,
          totalPrice: 1
      }},
      { $group: {
          _id: null,
          totalCost: { $sum: { $multiply: ['$costPrice', '$netQty'] } },
          totalRevenue: { $sum: '$totalPrice' }
      }}
    ]);

    const revenue = salesStats[0]?.totalRevenue || 0;
    const salesCount = salesStats[0]?.count || 0;
    const totalCost = profitStats[0]?.totalCost || 0;
    const profitRevenue = profitStats[0]?.totalRevenue || 0;
    const profit = Math.max(0, profitRevenue - totalCost);

    return {
      todayRevenue: revenue,
      todayProfit: profit,
      todaySalesCount: salesCount,
      pendingRepairsCount: pendingRepairs,
      lowStockItemsCount: lowStockCount,
      totalProductsCount: totalProducts
    };
  }

  async getSalesReport(tenantId, { startDate, endDate, groupBy = 'day' }) {
    const match = { tenantId: new mongoose.Types.ObjectId(tenantId), status: { $ne: 'cancelled' } };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    let groupFormat = '%Y-%m-%d';
    if (groupBy === 'week') groupFormat = '%Y-%U';
    if (groupBy === 'month') groupFormat = '%Y-%m';

    const sales = await Sale.aggregate([
      { $match: match },
      { $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          tax: { $sum: '$taxAmount' },
          discount: { $sum: '$discountAmount' },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    return sales;
  }

  async getProfitReport(tenantId, { startDate, endDate }) {
    const match = { tenantId: new mongoose.Types.ObjectId(tenantId) };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const stats = await SaleItem.aggregate([
      { $match: match },
      { $project: {
          dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          netQty: { $subtract: ['$quantity', '$returnedQuantity'] },
          costPrice: 1,
          totalPrice: 1
      }},
      { $group: {
          _id: '$dateStr',
          revenue: { $sum: '$totalPrice' },
          cost: { $sum: { $multiply: ['$costPrice', '$netQty'] } }
      }},
      { $project: {
          date: '$_id',
          revenue: 1,
          cost: 1,
          profit: { $subtract: ['$revenue', '$cost'] }
      }},
      { $sort: { date: 1 } }
    ]);

    return stats;
  }

  async getInventoryValuation(tenantId) {
    const valuation = await Inventory.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
      { $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productDoc'
      }},
      { $unwind: '$productDoc' },
      { $project: {
          quantity: 1,
          variantId: 1,
          variantInfo: {
            $filter: {
              input: '$productDoc.variants',
              as: 'v',
              cond: { $eq: ['$$v._id', '$variantId'] }
            }
          }
      }},
      { $project: {
          quantity: 1,
          priceInfo: { $arrayElemAt: ['$variantInfo', 0] }
      }},
      { $group: {
          _id: null,
          totalItems: { $sum: '$quantity' },
          totalCostValue: { $sum: { $multiply: ['$quantity', { $ifNull: ['$priceInfo.costPrice', 0] }] } },
          totalRetailValue: { $sum: { $multiply: ['$quantity', { $ifNull: ['$priceInfo.sellingPrice', 0] }] } }
      }}
    ]);

    return valuation[0] || { totalItems: 0, totalCostValue: 0, totalRetailValue: 0 };
  }

  async getStaffPerformance(tenantId, { startDate, endDate }) {
    const match = { tenantId: new mongoose.Types.ObjectId(tenantId), status: { $ne: 'cancelled' } };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const performance = await Sale.aggregate([
      { $match: match },
      { $group: {
          _id: '$salesman',
          totalSalesAmount: { $sum: '$totalAmount' },
          salesCount: { $sum: 1 }
      }},
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDoc'
      }},
      { $unwind: '$userDoc' },
      { $project: {
          salesmanId: '$_id',
          salesmanName: '$userDoc.name',
          salesmanEmail: '$userDoc.email',
          totalSalesAmount: 1,
          salesCount: 1
      }},
      { $sort: { totalSalesAmount: -1 } }
    ]);

    return performance;
  }
}

module.exports = new ReportService();
