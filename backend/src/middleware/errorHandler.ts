import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // Custom operational errors
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      error: err.message,
    });
    return;
  }

  // Unknown errors
  res.status(500).json({
    error: 'Internal server error',
  });
}

export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}
