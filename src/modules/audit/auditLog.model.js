const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'auth', 'stock_in', 'stock_out', 'adjustment', 'repair_update', 'sale'],
      required: true,
    },
    module: { type: String, required: true, trim: true },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ tenantId: 1, createdAt: -1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ module: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
