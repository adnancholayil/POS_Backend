const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema(
  {
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
    saleItem: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleItem' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true }, // snapshot
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
    imei: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    durationMonths: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'claimed', 'void'], default: 'active' },
    notes: { type: String, trim: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

warrantySchema.index({ imei: 1, tenantId: 1 });
warrantySchema.index({ customer: 1, tenantId: 1 });
warrantySchema.index({ endDate: 1 });
warrantySchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Warranty', warrantySchema);
