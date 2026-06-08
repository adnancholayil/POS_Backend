const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  variantLabel: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 },
  receivedQuantity: { type: Number, default: 0 },
  imeiList: [{ type: String, trim: true }],
}, { _id: true });

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [poItemSchema],
    status: { type: String, enum: ['draft', 'ordered', 'partially_received', 'received', 'cancelled'], default: 'draft' },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    expectedDeliveryDate: { type: Date },
    receivedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ tenantId: 1, status: 1 });
purchaseOrderSchema.index({ supplier: 1, tenantId: 1 });
purchaseOrderSchema.index({ poNumber: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
