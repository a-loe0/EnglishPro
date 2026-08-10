import { Request, Response, NextFunction, RequestHandler } from 'express';
import Redis from 'ioredis';

let redis: Redis | null = null;

// Initialize Redis connection
export function initRedisCache(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
    });

    redis.on('error', (err) => {
      console.error('Redis cache error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis cache connected');
    });
  }
  return redis;
}

export function getRedisCache(): Redis | null {
  return redis;
}

interface CacheOptions {
  ttl: number; // Time to live in seconds
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
}

// Default key generator based on URL and query params
function defaultKeyGenerator(req: Request, prefix: string): string {
  const userId = (req as Request & { user?: { userId: string } }).user?.userId || 'anon';
  const query = JSON.stringify(req.query);
  return `${prefix}:${userId}:${req.path}:${query}`;
}

// Cache middleware factory
export function cacheMiddleware(options: CacheOptions): RequestHandler {
  const { ttl, keyPrefix = 'api', keyGenerator } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    // Skip if Redis is not available
    if (!redis) {
      next();
      return;
    }

    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : defaultKeyGenerator(req, keyPrefix);

    try {
      // Try to get cached response
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        res.setHeader('X-Cache', 'HIT');
        res.json(parsed);
        return;
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = (body: unknown): Response => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis?.setex(cacheKey, ttl, JSON.stringify(body)).catch((err) => {
            console.error('Cache set error:', err);
          });
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

// Invalidate cache by pattern
export async function invalidateCache(pattern: string): Promise<number> {
  if (!redis) return 0;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return keys.length;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

// Invalidate specific cache key
export async function invalidateCacheKey(key: string): Promise<boolean> {
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Cache key invalidation error:', error);
    return false;
  }
}

// Cache helper for manual caching
export async function setCache(key: string, value: unknown, ttl: number): Promise<boolean> {
  if (!redis) return false;

  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

// Pre-configured cache middlewares for common use cases
export const videosCache = cacheMiddleware({
  ttl: 60, // 1 minute
  keyPrefix: 'videos',
});

export const coursesCache = cacheMiddleware({
  ttl: 300, // 5 minutes
  keyPrefix: 'courses',
});

export const analyticsCache = cacheMiddleware({
  ttl: 300, // 5 minutes
  keyPrefix: 'analytics',
});

export const progressCache = cacheMiddleware({
  ttl: 30, // 30 seconds (changes frequently)
  keyPrefix: 'progress',
});

export default {
  initRedisCache,
  getRedisCache,
  cacheMiddleware,
  invalidateCache,
  invalidateCacheKey,
  setCache,
  getCache,
  videosCache,
  coursesCache,
  analyticsCache,
  progressCache,
};
