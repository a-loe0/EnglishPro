import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * Rate-limit key for the true client.
 *
 * Prefers Cloudflare's CF-Connecting-IP: Cloudflare overwrites this header on
 * every proxied request, so unlike a raw X-Forwarded-For entry a client cannot
 * forge it to get its own bucket. Falls back to req.ip, which is only
 * meaningful when `trust proxy` is configured (see index.ts).
 *
 * ipKeyGenerator normalises IPv6 to a /56 subnet, so a single client cannot
 * cycle through its address range to bypass the limit.
 */
const clientKey = (req: Request): string => {
  const cf = req.headers['cf-connecting-ip'];
  const cfIp = Array.isArray(cf) ? cf[0] : cf;
  if (cfIp) return ipKeyGenerator(cfIp);
  return req.ip ? ipKeyGenerator(req.ip) : 'unknown';
};

/** Per-user when authenticated, else per-client-IP. */
const userOrClientKey = (req: Request): string => {
  const user = (req as Request & { user?: { userId: string } }).user;
  return user?.userId ?? clientKey(req);
};

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  keyGenerator: clientKey,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

// Stricter rate limiter for authentication endpoints.
//
// Keyed per client IP, which for this product often means a whole classroom or
// household behind one NAT address — a class starting a lesson together would
// trip a low limit. 20/min is a compromise: still far below what a credential
// brute-force needs, but high enough for a shared connection. Tune with
// AUTH_RATE_LIMIT_PER_MIN without a rebuild.
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_PER_MIN) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
  keyGenerator: clientKey,
});

// Rate limiter for video uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached, please try again later' },
  keyGenerator: userOrClientKey,
});

// Rate limiter for submission uploads
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 submissions per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Submission limit reached, please try again later' },
  keyGenerator: userOrClientKey,
});

// Rate limiter for analytics (computationally expensive)
export const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analytics requests, please try again later' },
  keyGenerator: userOrClientKey,
});

export default {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  submissionLimiter,
  analyticsLimiter,
};
