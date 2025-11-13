import { MicroserviceName } from '@app/core';
import { registerAs } from '@nestjs/config';

export const getAppConfig = () => ({
  appName: process.env.AUTH_SERVICE_APP_NAME,
  appPort: +process.env.AUTH_SERVICE_APP_PORT || 3301,
  microserviceName: MicroserviceName.AuthService,
});

export const appConfiguration = registerAs('app', getAppConfig);
