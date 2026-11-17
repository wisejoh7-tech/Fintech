import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export class CacheService {
  private static redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy: () => null // Don't retry in dev if it fails
  });

  static {
    this.redis.on('error', (err) => {
      // SILENT error handling to prevent process crash
    });
  }

  static async set(key: string, value: any, ttlSeconds?: number) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.redis.set(key, stringValue, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, stringValue);
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  static async delete(key: string) {
    await this.redis.del(key);
  }

  static async increment(key: string): Promise<number> {
    return await this.redis.incr(key);
  }
}
