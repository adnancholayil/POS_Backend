const attendanceService = require('./attendance.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getAllAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAllAttendance(req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Attendance logs fetched successfully.', result));
});

const checkIn = asyncHandler(async (req, res) => {
  const log = await attendanceService.checkIn(req.tenantId, req.user._id, req.body, req.ip);
  res.status(200).json(new ApiResponse(200, 'Checked in successfully.', log));
});

const checkOut = asyncHandler(async (req, res) => {
  const log = await attendanceService.checkOut(req.tenantId, req.user._id, req.body, req.ip);
  res.status(200).json(new ApiResponse(200, 'Checked out successfully.', log));
});

const markAttendance = asyncHandler(async (req, res) => {
  const log = await attendanceService.markAttendance(req.tenantId, req.body, req.user._id, req.ip);
  res.status(200).json(new ApiResponse(200, 'Attendance record updated successfully.', log));
});

module.exports = {
  getAllAttendance,
  checkIn,
  checkOut,
  markAttendance,
};
