import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constant';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async setValue<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.redis.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async getValue<T = any>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);

      if (typeof parsed !== 'object') {
        // handle string to be converted to number (e.g., '123' -> 123 while T = string)
        return data as unknown as T;
      }

      return parsed as T;
    } catch {
      return data as unknown as T;
    }
  }

  async deleteKey(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Get value from Redis hash
   * @param hashKey - The hash key
   * @param field - The field within the hash
   * @returns The value or null if not found
   */
  async getHashValue<T = any>(hashKey: string, field: string): Promise<T | null> {
    const data = await this.redis.hget(hashKey, field);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  /**
   * Set value in Redis hash with optional TTL
   * @param hashKey - The hash key
   * @param field - The field within the hash
   * @param value - The value to set
   * @param ttlSeconds - Optional TTL in seconds
   */
  async setHashValue<T = any>(
    hashKey: string,
    field: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redis.hset(hashKey, field, serialized);

    if (ttlSeconds) {
      await this.redis.expire(hashKey, ttlSeconds);
    }
  }

  async acquireLock(key: string, value: string, ttlSeconds: number) {
    const result = await this.redis.set(key, value, 'EX', ttlSeconds, 'NX');
    return !!result;
  }

  async releaseLock(key: string, lockValue: string) {
    const luaScript = `
      if redis.call("GET", KEYS[1]) == ARGV[1]
      then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    await this.redis.eval(luaScript, 1, key, lockValue);
  }

  public getResetPasswordKey(userId: string): string {
    return `user:${userId}:reset_password`;
  }

  public getUserInfoKey(userId: string): string {
    return `user:${userId}:info`;
  }

  public getUserTokenKey(userId: string, jti: string): string {
    return `user:${userId}:token:${jti}`;
  }

  public getUserTokenPattern(userId: string): string {
    return `user:${userId}:token:*`;
  }
}
