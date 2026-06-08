const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    logo: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

brandSchema.index({ name: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model('Brand', brandSchema);
