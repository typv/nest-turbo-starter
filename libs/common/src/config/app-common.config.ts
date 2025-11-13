import { NodeEnv } from '@app/common';
import { registerAs } from '@nestjs/config';

export const getAppCommonConfig = () => ({
  isProductionEnv: process.env.NODE_ENV === NodeEnv.Production,
  frontendUrl: process.env.FRONTEND_URL,
  timezone: process.env.TZ || "UTC",
});

export const appCommonConfiguration = registerAs('appCommon', getAppCommonConfig);
