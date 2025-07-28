import rateLimit from 'express-rate-limit';

// Global rate limit: 100 requests per 15 minutes per IP
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login-specific limiter: Prevent brute force
export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 5, // Only 5 failed attempts
  message: { message: 'Too many login attempts, please try again later.' }
});
