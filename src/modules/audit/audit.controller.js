const auditService = require('./audit.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditService.getAuditLogs(req.tenantId, req.query);
  res.status(200).json(new ApiResponse(200, 'Audit logs fetched successfully.', result));
});

module.exports = {
  getAuditLogs,
};
