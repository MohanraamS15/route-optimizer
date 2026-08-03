/**
 * AppError class for standardizing error responses.
 * Extends the built-in Error class with a status code.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    
    // Optional: Identify if this is a known operational error vs unexpected bug
    this.isOperational = true;

    // Capture the stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
