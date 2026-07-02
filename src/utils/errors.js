class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function errorHandler(error, req, res, next) {
  const status = error.statusCode || 500;
  if (status === 500) console.error(error);
  res.status(status).json({ error: error.message || "Error interno del servidor" });
}

module.exports = { AppError, asyncHandler, errorHandler };
