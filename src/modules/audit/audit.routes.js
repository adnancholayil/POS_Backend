const express = require('express');
const router = express.Router();
const controller = require('./audit.controller');
const { protect, hasPermission } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/', hasPermission('audit:read'), controller.getAuditLogs);

module.exports = router;
