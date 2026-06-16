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
    invoicePrefix: { type: String, default: 'INV', trim: true },
    repairTicketPrefix: { type: String, default: 'TKT', trim: true },
    poPrefix: { type: String, default: 'PO', trim: true },
    currency: { type: String, default: 'INR' },
    lowStockAlertEnabled: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
