const express = require('express');
const router = express.Router();
const controller = require('./audit.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/', controller.getAuditLogs);

module.exports = router;
