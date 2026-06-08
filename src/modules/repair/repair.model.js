const mongoose = require('mongoose');

const repairSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    deviceType: { type: String, enum: ['mobile', 'laptop', 'tablet', 'other'], required: true },
    deviceModel: { type: String, required: true, trim: true },
    deviceBrand: { type: String, trim: true },
    serialOrImei: { type: String, trim: true },
    issueDescription: { type: String, required: true, trim: true },
    accessoriesReceived: [{ type: String }],
    deviceCondition: { type: String, trim: true },
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'diagnosing', 'awaiting_parts', 'repairing', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt: { type: Date },
    estimatedDeliveryDate: { type: Date },
    warrantyDays: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    images: [{ url: String, publicId: String }],
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

repairSchema.index({ tenantId: 1, status: 1 });
repairSchema.index({ customer: 1, tenantId: 1 });
repairSchema.index({ assignedTechnician: 1, tenantId: 1 });
repairSchema.index({ ticketNumber: 1 });

module.exports = mongoose.model('Repair', repairSchema);
