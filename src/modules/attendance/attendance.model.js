const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: { type: String, enum: ['present', 'absent', 'late', 'leave', 'half_day'], default: 'present' },
    workingHours: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin/manager
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1, tenantId: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
