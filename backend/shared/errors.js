/**
 * Standardized Application Errors and Express Error Middleware
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Permission denied', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * Standard Express Error Handler
 */
export function errorHandler(logger) {
  return (err, req, res, next) => {
    const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    const code = err.code || 'INTERNAL_ERROR';
    const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || 'unknown';

    if (logger) {
      logger.error(err.message, {
        code,
        statusCode,
        correlationId,
        path: req.path,
        method: req.method,
        stack: err.stack
      });
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message: err.message || 'An unexpected error occurred',
        details: err.details || null,
        correlationId
      }
    });
  };
}
