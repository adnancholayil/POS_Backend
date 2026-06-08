const express = require('express');
const router = express.Router();
const controller = require('./user.controller');
const { protect, authorize, hasPermission } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');
const { body } = require('express-validator');
const validate = require('../../middlewares/validate.middleware');

router.use(protect);

// Profile routes (self)
router.get('/profile', controller.updateProfile);
router.patch('/profile', [body('name').optional().trim().notEmpty()], validate, controller.updateProfile);
router.patch('/avatar', upload.single('avatar'), controller.updateAvatar);

// Staff management (admin/manager)
router.get('/', hasPermission('users:read'), controller.getAllUsers);
router.get('/:id', hasPermission('users:read'), controller.getUserById);
router.post('/', hasPermission('users:create'), [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').notEmpty().withMessage('Role ID is required.'),
], validate, controller.createUser);
router.patch('/:id', hasPermission('users:update'), controller.updateUser);
router.delete('/:id', authorize('admin'), hasPermission('users:delete'), controller.deleteUser);

module.exports = router;
