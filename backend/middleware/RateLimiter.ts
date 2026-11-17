import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../services/CacheService';

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `ratelimit:${ip}`;
    const limit = 100; // 100 requests
    const window = 60; // 60 seconds

    const current = await CacheService.get(key);
    const count = current ? parseInt(current as string) : 0;

    if (count >= limit) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    await CacheService.set(key, (count + 1).toString(), window);
    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    next(); // Fail open to not block users if cache is down
  }
};
