const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true }, // snapshot
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    variantLabel: { type: String, default: '' }, // snapshot e.g. "Black 8GB 128GB"
    imei: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    costPrice: { type: Number, default: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    isReturned: { type: Boolean, default: false },
    returnedQuantity: { type: Number, default: 0 },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

saleItemSchema.index({ sale: 1 });
saleItemSchema.index({ product: 1, tenantId: 1 });
saleItemSchema.index({ imei: 1 });

module.exports = mongoose.model('SaleItem', saleItemSchema);
