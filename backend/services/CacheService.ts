import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export class CacheService {
  private static redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
  });

  static async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  static async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  static async delete(key: string) {
    await this.redis.del(key);
  }

  static async increment(key: string): Promise<number> {
    return await this.redis.incr(key);
  }
}
