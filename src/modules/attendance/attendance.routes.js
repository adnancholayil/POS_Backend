const express = require('express');
const router = express.Router();
const controller = require('./attendance.controller');
const { protect, hasPermission } = require('../../middlewares/auth.middleware');
const { body } = require('express-validator');
const validate = require('../../middlewares/validate.middleware');

router.use(protect);

router.get('/', hasPermission('attendance:read'), controller.getAllAttendance);

router.post('/check-in', [
  body('notes').optional().trim(),
], validate, controller.checkIn);

router.post('/check-out', [
  body('notes').optional().trim(),
], validate, controller.checkOut);

router.post('/mark', hasPermission('attendance:update'), [
  body('userId').isMongoId().withMessage('Invalid User ID.'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format.'),
  body('status').isIn(['present', 'absent', 'late', 'leave', 'half_day']).withMessage('Invalid attendance status.'),
  body('checkIn').optional().isISO8601().withMessage('Invalid check-in ISO timestamp.'),
  body('checkOut').optional().isISO8601().withMessage('Invalid check-out ISO timestamp.'),
], validate, controller.markAttendance);

module.exports = router;
