import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * Supports both Authorization header and query parameter (for video streaming)
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    let token: string | undefined;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Fall back to query parameter (for video/audio streaming where headers can't be set)
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to restrict access to specific roles
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user is a teacher
 */
export const isTeacher = authorize('TEACHER');

/**
 * Middleware to check if user is a student
 */
export const isStudent = authorize('STUDENT');
