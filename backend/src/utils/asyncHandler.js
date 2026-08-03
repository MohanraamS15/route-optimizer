/**
 * Wraps an async route handler to catch errors and pass them to Express next().
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
