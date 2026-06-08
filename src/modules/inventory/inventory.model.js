const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null }, // null = base product
    imeiList: [{ type: String, trim: true }], // for IMEI-tracked devices
    quantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    location: { type: String, trim: true, default: 'main' },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

inventorySchema.index({ product: 1, variantId: 1, tenantId: 1 }, { unique: true });
inventorySchema.index({ tenantId: 1, quantity: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
