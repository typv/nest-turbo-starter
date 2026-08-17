import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { REDIS_CLIENT } from './redis.constant';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (configService: ConfigService, logger: Logger) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        const redisClient = new IORedis(redisUrl, {
          // Keep reconnecting indefinitely, backing off to 5s.
          retryStrategy: (times) => Math.min(times * 200, 5_000),
          // Reconnect when a failover leaves this connection on a replica.
          reconnectOnError: (err) => err.message.includes('READONLY'),
          // Fail a queued command rather than holding the caller open for the
          // whole outage; callers decide whether the command is essential.
          maxRetriesPerRequest: 3,
        });

        redisClient.on('error', (err) => {
          logger.error({ message: `${err.message}`, context: 'RedisClient' });
        });

        redisClient.on('connect', () => {
          logger.info({
            message: `Redis client connected`,
            context: 'RedisClient',
          });
        });

        redisClient.on('reconnecting', (delay: number) => {
          logger.warn({
            message: `Redis client reconnecting in ${delay}ms`,
            context: 'RedisClient',
          });
        });

        // Check redis connection
        try {
          await redisClient.ping();
        } catch (err) {
          throw new Error(err.message, { cause: err });
        }

        return redisClient;
      },
      inject: [ConfigService, WINSTON_MODULE_PROVIDER],
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
