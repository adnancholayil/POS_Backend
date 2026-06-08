/**
 * Build a pagination object from query params
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build pagination metadata for response
 */
const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Build a sort object from query params
 * e.g. ?sortBy=createdAt&sortOrder=desc
 */
const getSort = (query, allowedFields = []) => {
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    return { createdAt: -1 };
  }
  return { [sortBy]: sortOrder };
};

/**
 * Build a date range filter for MongoDB queries
 */
const getDateRangeFilter = (query, field = 'createdAt') => {
  const filter = {};
  if (query.startDate || query.endDate) {
    filter[field] = {};
    if (query.startDate) filter[field].$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter[field].$lte = end;
    }
  }
  return filter;
};

module.exports = { getPagination, getPaginationMeta, getSort, getDateRangeFilter };
