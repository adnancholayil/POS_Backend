const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    gstin: { type: String, trim: true },
    notes: { type: String, trim: true },
    totalPurchases: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

customerSchema.index({ phone: 1, tenantId: 1 }, { unique: true });
customerSchema.index({ name: 'text', phone: 'text', email: 'text' });
customerSchema.index({ tenantId: 1, isActive: 1 });

module.exports = mongoose.model('Customer', customerSchema);
