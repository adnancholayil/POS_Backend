const express = require('express');
const router = express.Router();
const controller = require('./task.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { body } = require('express-validator');
const validate = require('../../middlewares/validate.middleware');

// All task routes require authentication only — no strict permission checks
router.use(protect);

router.get('/', controller.getAllTasks);
router.get('/:id', controller.getTaskById);

router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required.'),
  body('assignedTo').isMongoId().withMessage('Invalid assignee User ID.'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority.'),
  body('dueDate').optional().isISO8601().toDate().withMessage('Invalid due date format.'),
], validate, controller.createTask);

router.put('/:id', [
  body('title').optional().trim().notEmpty().withMessage('Task title cannot be empty.'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignee User ID.'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority.'),
], validate, controller.updateTask);

router.patch('/:id/status', [
  body('status').isIn(['todo', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status.'),
], validate, controller.updateTaskStatus);

router.delete('/:id', controller.deleteTask);

module.exports = router;
