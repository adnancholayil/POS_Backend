const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, trim: true }, // snapshot for walk-in
    salesman: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer', 'credit', 'mixed'], default: 'cash' },
    paymentStatus: { type: String, enum: ['paid', 'pending', 'partial', 'refunded'], default: 'paid' },
    subTotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['completed', 'partially_returned', 'returned', 'cancelled'], default: 'completed' },
    notes: { type: String, trim: true },
    invoicePath: { type: String }, // Cloudinary PDF URL
    isGSTInvoice: { type: Boolean, default: false },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ tenantId: 1, createdAt: -1 });
saleSchema.index({ customer: 1, tenantId: 1 });
saleSchema.index({ salesman: 1, tenantId: 1 });

module.exports = mongoose.model('Sale', saleSchema);
