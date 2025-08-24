export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Array<{ path: string; issue: string }>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Array<{ path: string; issue: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Array<{ path: string; issue: string }>) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export const errorHandler = (err: any, req: any, res: any, next: any) => {
  let error = err;

  if (err.name === 'ZodError') {
    const details = err.errors.map((e: any) => ({
      path: e.path.join('.'),
      issue: e.message,
    }));
    error = new ValidationError('Validation failed', details);
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      error = new ConflictError('Resource already exists');
    } else if (err.code === 'P2025') {
      error = new NotFoundError('Resource not found');
    }
  }

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'Internal server error';
  const details = error.details || [];

  res.status(statusCode).json({
    error: {
      message,
      code,
      details,
    },
  });
};

