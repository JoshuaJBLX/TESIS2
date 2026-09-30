import { Request, Response, NextFunction } from 'express';

interface Bucket { count: number; resetAt: number; }

export function createRateLimiter(windowMs: number, max: number, message = 'Demasiadas solicitudes. Intenta nuevamente más tarde.') {
  const buckets = new Map<string, Bucket>();
  const middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) { bucket = { count: 0, resetAt: now + windowMs }; buckets.set(key, bucket); }
    bucket.count += 1;
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, max - bucket.count));
    res.setHeader('RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));
    if (bucket.count > max) { res.status(429).json({ success: false, error: message, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }); return; }
    next();
  };
  return middleware;
}

export function bruteForceProtection(windowMs = 15 * 60 * 1000, maxAttempts = 5) {
  const failures = new Map<string, { count: number; blockedUntil: number }>();
  return {
    check(key: string): number {
      const item = failures.get(key);
      if (!item || item.blockedUntil <= Date.now()) { if (item) failures.delete(key); return 0; }
      return item.count;
    },
    failed(key: string): void {
      const item = failures.get(key) || { count: 0, blockedUntil: Date.now() + windowMs };
      item.count += 1; item.blockedUntil = Date.now() + windowMs; failures.set(key, item);
    },
    succeeded(key: string): void { failures.delete(key); },
    maxAttempts
  };
}
