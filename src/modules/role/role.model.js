const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      lowercase: true,
      enum: ['admin', 'manager', 'salesman'],
    },
    description: { type: String, trim: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

roleSchema.index({ name: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);
