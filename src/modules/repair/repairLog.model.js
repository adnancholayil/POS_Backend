const mongoose = require('mongoose');

const repairLogSchema = new mongoose.Schema(
  {
    repair: { type: mongoose.Schema.Types.ObjectId, ref: 'Repair', required: true },
    status: {
      type: String,
      enum: ['pending', 'diagnosing', 'awaiting_parts', 'repairing', 'ready', 'delivered', 'cancelled'],
      required: true,
    },
    notes: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

repairLogSchema.index({ repair: 1 });
repairLogSchema.index({ tenantId: 1 });

module.exports = mongoose.model('RepairLog', repairLogSchema);
