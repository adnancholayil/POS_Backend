const express = require('express');
const router = express.Router();
const controller = require('./role.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');
const { body } = require('express-validator');
const validate = require('../../middlewares/validate.middleware');

router.use(protect);

// All role management is admin-only
router.get('/permissions', controller.getAllPermissions);
router.get('/', authorize('admin'), controller.getAllRoles);
router.get('/:id', authorize('admin'), controller.getRoleById);
router.put('/:id/permissions', authorize('admin'), [
  body('permissions').isArray().withMessage('permissions must be an array of IDs.'),
], validate, controller.updateRolePermissions);
router.post('/:id/permissions', authorize('admin'), [
  body('permissionId').notEmpty().withMessage('permissionId is required.'),
], validate, controller.assignPermission);
router.delete('/:id/permissions/:permissionId', authorize('admin'), controller.removePermission);

module.exports = router;
