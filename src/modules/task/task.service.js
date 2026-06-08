const taskRepository = require('./task.repository');
const ApiError = require('../../utils/apiError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getPagination, getPaginationMeta, getSort } = require('../../utils/queryHelper');
const { emitToTenant } = require('../../config/socket');

class TaskService {
  async getAllTasks(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const sort = getSort(query, ['createdAt', 'dueDate', 'priority', 'status']);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.assignedTo) filter.assignedTo = query.assignedTo;
    if (query.assignedBy) filter.assignedBy = query.assignedBy;
    if (query.q) {
      filter.$or = [
        { title: { $regex: query.q, $options: 'i' } },
        { description: { $regex: query.q, $options: 'i' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      taskRepository.findAll({ tenantId, filter, skip, limit, sort }),
      taskRepository.count({ tenantId, filter }),
    ]);

    return { tasks, pagination: getPaginationMeta(total, page, limit) };
  }

  async getTaskById(id, tenantId) {
    const task = await taskRepository.findById(id, tenantId);
    if (!task) throw new ApiError(404, 'Task not found.');
    return task;
  }

  async createTask(tenantId, data, userId, ip) {
    const task = await taskRepository.create({
      ...data,
      assignedBy: userId,
      tenantId,
    });

    // Notify assignee via socket
    try {
      emitToTenant(tenantId.toString(), 'new_task', {
        taskId: task._id,
        title: task.title,
        assignedTo: task.assignedTo,
      });
    } catch (_) {}

    await createAuditLog({
      userId,
      tenantId,
      action: 'create',
      module: 'tasks',
      details: { taskId: task._id, title: task.title, assignedTo: task.assignedTo },
      ipAddress: ip,
    });

    return task;
  }

  async updateTask(id, tenantId, data, userId, ip) {
    const task = await taskRepository.findById(id, tenantId);
    if (!task) throw new ApiError(404, 'Task not found.');

    const updated = await taskRepository.update(id, tenantId, data);

    await createAuditLog({
      userId,
      tenantId,
      action: 'update',
      module: 'tasks',
      details: { taskId: id, changes: data },
      ipAddress: ip,
    });

    return updated;
  }

  async updateTaskStatus(id, tenantId, { status }, userId, ip) {
    const task = await taskRepository.findById(id, tenantId);
    if (!task) throw new ApiError(404, 'Task not found.');

    const updateFields = { status };
    if (status === 'completed') {
      updateFields.completedAt = new Date();
    } else {
      updateFields.completedAt = null;
    }

    const updated = await taskRepository.update(id, tenantId, updateFields);

    // Socket notification
    try {
      emitToTenant(tenantId.toString(), 'task_status_change', {
        taskId: id,
        title: task.title,
        status,
        assignedTo: task.assignedTo,
      });
    } catch (_) {}

    await createAuditLog({
      userId,
      tenantId,
      action: 'update_status',
      module: 'tasks',
      details: { taskId: id, title: task.title, oldStatus: task.status, newStatus: status },
      ipAddress: ip,
    });

    return updated;
  }

  async deleteTask(id, tenantId, userId, ip) {
    const task = await taskRepository.findById(id, tenantId);
    if (!task) throw new ApiError(404, 'Task not found.');

    await taskRepository.delete(id, tenantId);

    await createAuditLog({
      userId,
      tenantId,
      action: 'delete',
      module: 'tasks',
      details: { taskId: id, title: task.title },
      ipAddress: ip,
    });

    return true;
  }
}

module.exports = new TaskService();
