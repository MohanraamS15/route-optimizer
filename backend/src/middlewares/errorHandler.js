import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error({ err }, "Global Error Handler caught error");


  // If it's a known validation error (like from Zod), we can format it
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: err.errors });
  }

  // Generic errors
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: message,
    // Optionally include stack trace in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
