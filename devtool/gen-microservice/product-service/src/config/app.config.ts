import { APP_DEFAULTS } from '@app/common';
import { MicroserviceName } from '@app/core';
import { registerAs } from '@nestjs/config';

export const getAppConfig = () => ({
  appName: process.env.PRODUCT_SERVICE_APP_NAME,
  appPort: +process.env.PRODUCT_SERVICE_APP_PORT || 3302,
  microserviceName: MicroserviceName.UserService,
  queueDashboardPassword:
    process.env.PRODUCT_SERVICE_QUEUE_DASHBOARD_PASSWORD ||
    APP_DEFAULTS.QUEUE_DASHBOARD_PASSWORD,
});

export const appConfiguration = registerAs('app', getAppConfig);
