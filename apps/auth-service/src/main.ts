import { getAppCommonConfig, getWinstonConfig, logBootstrapInfo, setupSwagger } from '@app/common';
import { PayloadValidationPipe } from '@app/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import requestId from 'express-request-id';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { getAppConfig } from 'src/config/app.config';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const { appName, appPort } = getAppConfig();
  const { isProductionEnv } = getAppCommonConfig();
  const logger = WinstonModule.createLogger(getWinstonConfig(appName, isProductionEnv));

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  const reflector = app.get(Reflector);

  app.use(helmet());
  app.enableCors();
  app.use(requestId());
  // app.use(
  //   rateLimit({
  //     windowMs: 60 * 1000, // 1 minutes
  //     limit: 100, // Limit each IP to 100 requests per `window` (here, per 1 minutes).
  //     standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  //     legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  //   }),
  // );
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new PayloadValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  setupSwagger(app, appName, ['/auth-service']);
  await app.init();

  await app.listen(appPort);

  logBootstrapInfo(app, {
    isProductionEnv,
    logger,
    appPort,
  });
}

bootstrap();
