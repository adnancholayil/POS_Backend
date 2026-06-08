const mongoose = require('mongoose');

const usedDeviceSchema = new mongoose.Schema(
  {
    deviceType: { type: String, enum: ['mobile', 'laptop', 'tablet', 'other'], required: true },
    deviceModel: { type: String, required: true, trim: true },
    deviceBrand: { type: String, trim: true },
    serialOrImei: { type: String, trim: true },
    color: { type: String, trim: true },
    storage: { type: String, trim: true },
    ram: { type: String, trim: true },
    condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], required: true },
    evaluationNotes: { type: String, trim: true },
    images: [{ url: String, publicId: String }],
    sourcedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // bought from this customer
    sourcedFromName: { type: String, trim: true },
    buyingPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, default: 0 },
    status: { type: String, enum: ['purchased', 'refurbishing', 'ready_for_sale', 'sold', 'scrapped'], default: 'purchased' },
    soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    soldVia: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
    soldAt: { type: Date },
    boughtAt: { type: Date, default: Date.now },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

usedDeviceSchema.index({ tenantId: 1, status: 1 });
usedDeviceSchema.index({ serialOrImei: 1, tenantId: 1 });

module.exports = mongoose.model('UsedDevice', usedDeviceSchema);
