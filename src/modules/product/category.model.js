const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
