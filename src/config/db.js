const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    if (uri.startsWith('MONGODB_URI=')) {
      uri = uri.substring('MONGODB_URI='.length);
    }
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
