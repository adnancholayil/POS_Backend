const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }
    if (uri.startsWith('MONGODB_URI=')) {
      uri = uri.substring('MONGODB_URI='.length);
    }
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Sync permissions for managers of existing tenants
    try {
      const Permission = require('../modules/role/permission.model');
      const Role = require('../modules/role/role.model');

      const requiredPermissions = [
        { name: 'users:create', module: 'users', description: 'Create staff users' },
        { name: 'users:update', module: 'users', description: 'Update staff users' }
      ];

      const permDocs = await Promise.all(
        requiredPermissions.map(p => 
          Permission.findOneAndUpdate({ name: p.name }, p, { upsert: true, new: true })
        )
      );

      const permIds = permDocs.map(p => p._id);

      const managers = await Role.find({ name: 'manager' });
      for (const manager of managers) {
        let modified = false;
        for (const pId of permIds) {
          if (!manager.permissions.some(p => p.toString() === pId.toString())) {
            manager.permissions.push(pId);
            modified = true;
          }
        }
        if (modified) {
          await manager.save();
          logger.info(`Updated existing manager role ${manager._id} with users:create and users:update permissions`);
        }
      }
    } catch (syncError) {
      logger.error(`Error syncing manager permissions on startup: ${syncError.message}`);
    }
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
