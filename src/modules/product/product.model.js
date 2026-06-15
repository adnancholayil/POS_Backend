const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    color: { type: String, trim: true },
    storage: { type: String, trim: true },
    ram: { type: String, trim: true },
    sellingPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, min: 0, default: 0 },
    sku: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    barcode: { type: String, trim: true },
    description: { type: String, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    productType: { type: String, enum: ['mobile', 'laptop', 'accessory', 'spare_part', 'other'], default: 'mobile' },
    images: [{ url: String, publicId: String }],
    variants: [variantSchema],
    price: { type: Number, default: 0, min: 0 },
    cost: { type: Number, default: 0, min: 0 },
    hasIMEI: { type: Boolean, default: false },
    warrantyMonths: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 }, // GST %
    isActive: { type: Boolean, default: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

productSchema.index({ tenantId: 1, isActive: 1 });
productSchema.index({ name: 'text', sku: 'text', barcode: 'text' }); // Full-text search
productSchema.index({ category: 1, tenantId: 1 });
productSchema.index({ brand: 1, tenantId: 1 });
productSchema.index({ tenantId: 1, barcode: 1 });

module.exports = mongoose.model('Product', productSchema);
