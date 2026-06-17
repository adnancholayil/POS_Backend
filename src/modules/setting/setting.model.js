const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    shopCode: { type: String, unique: true, sparse: true },
    shopName: { type: String, trim: true, default: 'My Shop' },
    shopAddress: { type: String, trim: true },
    shopPhone: { type: String, trim: true },
    shopEmail: { type: String, trim: true },
    shopLogo: { type: String, default: '' },
    gstNumber: { type: String, trim: true },
    defaultTaxRate: { type: Number, default: 18 },
    printType: { type: String, default: 'thermal', enum: ['thermal', 'a4', 'whatsapp'] },
    salesPrintType: { type: String, default: 'thermal', enum: ['thermal', 'a4', 'whatsapp'] },
    purchasePrintType: { type: String, default: 'thermal', enum: ['thermal', 'a4', 'whatsapp'] },
    invoicePrefix: { type: String, default: 'INV', trim: true },
    repairTicketPrefix: { type: String, default: 'TKT', trim: true },
    poPrefix: { type: String, default: 'PO', trim: true },
    currency: { type: String, default: 'INR' },
    terms: { type: String, default: '', trim: true },
    lowStockAlertEnabled: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    primaryColorType: { type: String, default: 'solid', enum: ['solid', 'gradient'] },
    primaryColorSolid: { type: String, default: '#2563eb' },
    primaryColorGradient: {
      from: { type: String, default: '#06b6d4' },
      to: { type: String, default: '#3b82f6' },
      angle: { type: String, default: '135deg' }
    },
    secondaryColorType: { type: String, default: 'solid', enum: ['solid', 'gradient'] },
    secondaryColorSolid: { type: String, default: '#8b5cf6' },
    secondaryColorGradient: {
      from: { type: String, default: '#8b5cf6' },
      to: { type: String, default: '#ec4899' },
      angle: { type: String, default: '135deg' }
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
