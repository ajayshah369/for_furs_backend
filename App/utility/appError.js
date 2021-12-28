class AppError extends Error {
  constructor(statusCode, message, status) {
    super(message);

    this.statusCode = statusCode;
    this.status = status;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
