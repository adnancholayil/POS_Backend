const attendanceRepository = require('./attendance.repository');
const ApiError = require('../../utils/apiError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getPagination, getPaginationMeta, getSort } = require('../../utils/queryHelper');

class AttendanceService {
  async getAllAttendance(tenantId, query) {
    const { page, limit, skip } = getPagination(query);
    const sort = getSort(query, ['date', 'createdAt']);
    const filter = {};
    if (query.userId) filter.user = query.userId;
    if (query.date) filter.date = query.date;
    if (query.status) filter.status = query.status;

    const [logs, total] = await Promise.all([
      attendanceRepository.findAll({ tenantId, filter, skip, limit, sort }),
      attendanceRepository.count({ tenantId, filter }),
    ]);

    return { logs, pagination: getPaginationMeta(total, page, limit) };
  }

  async checkIn(tenantId, userId, { notes }, ip) {
    const today = new Date().toISOString().split('T')[0];
    const existing = await attendanceRepository.findByUserAndDate(userId, today, tenantId);

    if (existing) {
      throw new ApiError(400, 'You have already checked in for today.');
    }

    const attendance = await attendanceRepository.create({
      user: userId,
      date: today,
      checkIn: new Date(),
      status: 'present',
      notes,
      tenantId,
    });

    await createAuditLog({
      userId,
      tenantId,
      action: 'check_in',
      module: 'attendance',
      details: { attendanceId: attendance._id, date: today },
      ipAddress: ip,
    });

    return attendance;
  }

  async checkOut(tenantId, userId, { notes }, ip) {
    const today = new Date().toISOString().split('T')[0];
    const existing = await attendanceRepository.findByUserAndDate(userId, today, tenantId);

    if (!existing) {
      throw new ApiError(400, 'No check-in record found for today. Please check in first.');
    }

    if (existing.checkOut) {
      throw new ApiError(400, 'You have already checked out for today.');
    }

    const checkOutTime = new Date();
    const checkInTime = existing.checkIn;
    let workingHours = 0;
    if (checkInTime) {
      workingHours = Math.round(((checkOutTime - checkInTime) / (1000 * 60 * 60)) * 100) / 100; // in hours
    }

    const updated = await attendanceRepository.update(existing._id, tenantId, {
      checkOut: checkOutTime,
      workingHours,
      notes: notes || existing.notes,
    });

    await createAuditLog({
      userId,
      tenantId,
      action: 'check_out',
      module: 'attendance',
      details: { attendanceId: existing._id, date: today, workingHours },
      ipAddress: ip,
    });

    return updated;
  }

  async markAttendance(tenantId, { userId, date, status, checkIn, checkOut, notes }, adminId, ip) {
    const existing = await attendanceRepository.findByUserAndDate(userId, date, tenantId);

    let checkInDate = checkIn ? new Date(checkIn) : null;
    let checkOutDate = checkOut ? new Date(checkOut) : null;
    let workingHours = 0;

    if (checkInDate && checkOutDate) {
      workingHours = Math.round(((checkOutDate - checkInDate) / (1000 * 60 * 60)) * 100) / 100;
    }

    let record;
    if (existing) {
      record = await attendanceRepository.update(existing._id, tenantId, {
        status,
        checkIn: checkInDate || existing.checkIn,
        checkOut: checkOutDate || existing.checkOut,
        workingHours: workingHours || existing.workingHours,
        notes,
        markedBy: adminId,
      });
    } else {
      record = await attendanceRepository.create({
        user: userId,
        date,
        status,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        workingHours,
        notes,
        markedBy: adminId,
        tenantId,
      });
    }

    await createAuditLog({
      userId: adminId,
      tenantId,
      action: 'mark_attendance',
      module: 'attendance',
      details: { targetUserId: userId, date, status },
      ipAddress: ip,
    });

    return record;
  }
}

module.exports = new AttendanceService();
