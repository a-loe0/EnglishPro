import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  keyGenerator: (req: Request) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
  keyGenerator: (req: Request) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
});

// Rate limiter for video uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached, please try again later' },
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    const user = (req as Request & { user?: { userId: string } }).user;
    return user?.userId || req.ip || 'unknown';
  },
});

// Rate limiter for submission uploads
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 submissions per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Submission limit reached, please try again later' },
  keyGenerator: (req: Request) => {
    const user = (req as Request & { user?: { userId: string } }).user;
    return user?.userId || req.ip || 'unknown';
  },
});

// Rate limiter for analytics (computationally expensive)
export const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analytics requests, please try again later' },
  keyGenerator: (req: Request) => {
    const user = (req as Request & { user?: { userId: string } }).user;
    return user?.userId || req.ip || 'unknown';
  },
});

export default {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  submissionLimiter,
  analyticsLimiter,
};
