const mongoose = require('mongoose');

const repairPartSchema = new mongoose.Schema(
  {
    repair: { type: mongoose.Schema.Types.ObjectId, ref: 'Repair', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // spare part product
    productName: { type: String, required: true, trim: true }, // snapshot / manual entry
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

repairPartSchema.index({ repair: 1 });

module.exports = mongoose.model('RepairPart', repairPartSchema);
