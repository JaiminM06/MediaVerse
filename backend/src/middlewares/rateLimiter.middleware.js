import rateLimit from 'express-rate-limit';
import redis from '../config/redis.js';
import { logger } from '../utils/logger.js';

export const createRateLimiter = (options) => {
  if (process.env.BYPASS_LIMITER === 'true') {
    return (req, res, next) => next();
  }

  if (process.env.NODE_ENV === 'test') {
    return rateLimit(options);
  }

  return async (req, res, next) => {
    // If redis is not initialized or connected, fallback to express-rate-limit memory store
    if (!redis) {
      return rateLimit(options)(req, res, next);
    }

    try {
      // Resolve client IP (supporting reverse proxies if trust proxy is configured)
      const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
      const key = `ratelimit:${ip}:${req.baseUrl || req.path}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, options.windowMs);
      }
      if (count > options.max) {
        return res.status(429).json(options.message);
      }
      
      next();
    } catch (err) {
      logger.error({ err }, "Redis rate limiter error, falling back to memory store");
      // Fallback to express-rate-limit in case of redis errors
      return rateLimit(options)(req, res, next);
    }
  };
};

const isJest = typeof process.env.JEST_WORKER_ID !== 'undefined';

// General API limiter — all routes
export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: isJest ? 999999 : (process.env.NODE_ENV === 'production' ? 100 : 10000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' }
});

// Strict limiter — auth routes (login, register, refresh)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isJest ? 10 : (process.env.NODE_ENV === 'test' ? 999999 : 2000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later' }
});

// Upload limiter — presigned URL requests
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 20,                     // max 20 upload initiations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload limit reached, please try again later' }
});
