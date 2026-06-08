const express = require('express');
const router = express.Router();
const controller = require('./repair.controller');
const { protect, hasPermission } = require('../../middlewares/auth.middleware');
const { body } = require('express-validator');
const validate = require('../../middlewares/validate.middleware');

router.use(protect);

router.get('/technicians', hasPermission('repairs:read'), controller.getTechnicians);
router.put('/technicians/:userId', hasPermission('repairs:update'), [
  body('status').optional().isIn(['available', 'busy', 'off_duty']).withMessage('Invalid technician status.'),
  body('specialties').optional().isArray().withMessage('Specialties must be an array of strings.'),
], validate, controller.updateTechnician);

router.get('/', hasPermission('repairs:read'), controller.getAllRepairs);
router.get('/:id', hasPermission('repairs:read'), controller.getRepairById);

router.post('/', hasPermission('repairs:create'), [
  body('customer').isMongoId().withMessage('Invalid customer ID.'),
  body('deviceType').isIn(['mobile', 'laptop', 'tablet', 'other']).withMessage('Invalid device type.'),
  body('deviceModel').trim().notEmpty().withMessage('Device model is required.'),
  body('issueDescription').trim().notEmpty().withMessage('Issue description is required.'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority.'),
], validate, controller.createRepair);

router.put('/:id', hasPermission('repairs:update'), [
  body('customer').optional().isMongoId().withMessage('Invalid customer ID.'),
  body('deviceType').optional().isIn(['mobile', 'laptop', 'tablet', 'other']).withMessage('Invalid device type.'),
  body('deviceModel').optional().trim().notEmpty().withMessage('Device model cannot be empty.'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority.'),
], validate, controller.updateRepair);

router.patch('/:id/status', hasPermission('repairs:update'), [
  body('status').isIn(['pending', 'diagnosing', 'awaiting_parts', 'repairing', 'ready', 'delivered', 'cancelled']).withMessage('Invalid status.'),
  body('notes').optional().trim(),
], validate, controller.updateStatus);

router.post('/:id/parts', hasPermission('repairs:update'), [
  body('productId').isMongoId().withMessage('Invalid spare part product ID.'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1.'),
], validate, controller.addPart);

router.delete('/:id/parts/:partId', hasPermission('repairs:update'), controller.removePart);

module.exports = router;
