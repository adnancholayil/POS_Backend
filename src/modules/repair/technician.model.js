const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialties: [{ type: String, trim: true }],
    status: { type: String, enum: ['available', 'busy', 'off_duty'], default: 'available' },
    totalRepairs: { type: Number, default: 0 },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

technicianSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Technician', technicianSchema);

