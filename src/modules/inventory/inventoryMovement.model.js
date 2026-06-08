const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    type: { type: String, enum: ['stock_in', 'stock_out', 'adjustment', 'return'], required: true },
    quantity: { type: Number, required: true },
    quantityBefore: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },
    reason: { type: String, trim: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // sale/purchase order ID
    referenceModel: { type: String, enum: ['Sale', 'PurchaseOrder', 'Repair', null] },
    imeiList: [{ type: String, trim: true }],
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ tenantId: 1, createdAt: -1 });
inventoryMovementSchema.index({ product: 1, tenantId: 1 });
inventoryMovementSchema.index({ type: 1, tenantId: 1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
