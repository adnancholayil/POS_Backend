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

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      monthSalesStats,
      completedRepairs,
      lowStockCount,
      totalProducts,
      recentSales,
      recentRepairs
    ] = await Promise.all([
      // Sales stats for this month
      Sale.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), status: { $ne: 'cancelled' }, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]),
      // Completed Repairs count
      Repair.countDocuments({ tenantId, status: { $in: ['ready', 'delivered'] } }),
      // Low stock count
      Inventory.countDocuments({ tenantId, $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }),
      // Total products
      Product.countDocuments({ tenantId, isActive: true }),
      // Recent 5 sales
      Sale.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customer'),
      // Recent 5 repairs
      Repair.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customer')
    ]);

    const totalSalesAmount = monthSalesStats[0]?.totalRevenue || 0;

    // Generate last 7 days salesTrend for charts
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch sales total for this day
      const daySales = await Sale.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), status: { $ne: 'cancelled' }, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]);

      // Fetch repairs count for this day
      const dayRepairs = await Repair.countDocuments({
        tenantId,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      // Fetch cost/profit for this day
      const dayProfitStats = await SaleItem.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), createdAt: { $gte: startOfDay, $lte: endOfDay } } },
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

      const salesVal = daySales[0]?.totalRevenue || 0;
      const profitVal = Math.max(0, (dayProfitStats[0]?.totalRevenue || 0) - (dayProfitStats[0]?.totalCost || 0));

      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      salesTrend.push({
        date: daysOfWeek[d.getDay()],
        sales: salesVal,
        repairs: dayRepairs,
        profit: profitVal
      });
    }

    // Map recent items to match frontend structure (with customerName snapshot)
    const mappedRecentSales = recentSales.map(s => ({
      _id: s._id,
      invoiceNumber: s.invoiceNumber,
      customerName: s.customerName || s.customer?.name || 'Walk-in Customer',
      totalAmount: s.totalAmount,
      createdAt: s.createdAt
    }));

    const mappedRecentRepairs = recentRepairs.map(r => ({
      _id: r._id,
      ticketNumber: r.ticketNumber,
      deviceModel: r.deviceModel,
      customerName: r.customer?.name || 'Walk-in Customer',
      estimatedCost: r.estimatedCost,
      status: r.status,
      createdAt: r.createdAt
    }));

    return {
      totalSalesAmount,
      totalRevenue: totalSalesAmount,
      completedRepairsCount: completedRepairs,
      lowStockCount,
      totalProductsCount: totalProducts,
      salesTrend,
      recentSales: mappedRecentSales,
      recentRepairs: mappedRecentRepairs
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
