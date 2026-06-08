const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const errorMiddleware = require('./middlewares/error.middleware');
const ApiError = require('./utils/apiError');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Parse json request body
app.use(express.json({ limit: '10mb' }));

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Gzip compression
app.use(compression());

// In-house zero-dependency cookie parser
app.use((req, res, next) => {
  if (req.headers.cookie) {
    req.cookies = Object.fromEntries(
      req.headers.cookie.split('; ').map((c) => {
        const [k, v] = c.split('=');
        return [k, decodeURIComponent(v)];
      })
    );
  } else {
    req.cookies = {};
  }
  next();
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'POS SaaS Backend API is running.' });
});

// Mount module routes
app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/users', require('./modules/user/user.routes'));
app.use('/api/v1/roles', require('./modules/role/role.routes'));
app.use('/api/v1/products', require('./modules/product/product.routes'));
app.use('/api/v1/inventory', require('./modules/inventory/inventory.routes'));
app.use('/api/v1/customers', require('./modules/customer/customer.routes'));
app.use('/api/v1/sales', require('./modules/sales/sale.routes'));
app.use('/api/v1/repairs', require('./modules/repair/repair.routes'));
app.use('/api/v1/used-devices', require('./modules/usedDevice/usedDevice.routes'));
app.use('/api/v1/tasks', require('./modules/task/task.routes'));
app.use('/api/v1/suppliers', require('./modules/supplier/supplier.routes'));
app.use('/api/v1/attendance', require('./modules/attendance/attendance.routes'));
app.use('/api/v1/settings', require('./modules/setting/setting.routes'));
app.use('/api/v1/notifications', require('./modules/notification/notification.routes'));
app.use('/api/v1/audit', require('./modules/audit/audit.routes'));
app.use('/api/v1/reports', require('./modules/report/report.routes'));

// Send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(404, 'Endpoint not found.'));
});

// Centralized error handler
app.use(errorMiddleware);

module.exports = app;
