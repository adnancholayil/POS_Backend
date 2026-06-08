const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      // Format: module:action  e.g., "products:create", "sales:delete"
    },
    description: { type: String, trim: true },
    module: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

permissionSchema.index({ name: 1 });
permissionSchema.index({ module: 1 });

module.exports = mongoose.model('Permission', permissionSchema);
