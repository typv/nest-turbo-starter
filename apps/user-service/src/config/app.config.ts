import { MicroserviceName } from '@app/core';
import { registerAs } from '@nestjs/config';

export const getAppConfig = () => ({
  appName: process.env.USER_SERVICE_APP_NAME,
  appPort: +process.env.USER_SERVICE_APP_PORT || 3302,
  cacheTtlInMinutes: +process.env.USER_SERVICE_APP_CACHE_TTL_MINUTES || 6 * 60,
  microserviceName: MicroserviceName.UserService,
});

export const appConfiguration = registerAs('app', getAppConfig);
