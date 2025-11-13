import { getAppCommonConfig, getWinstonConfig, logBootstrapInfo, setupSwagger } from '@app/common';
import { PayloadValidationPipe } from '@app/common';
import {
  MicroserviceConfigOptions,
  MicroserviceFactory,
  MicroserviceName,
} from '@app/core';
import { ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import chalk from 'chalk';
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
  const configService: ConfigService = await app.get(ConfigService);

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

  setupSwagger(app, appName, ['/user-service']);
  await app.init();

  // Start microservice
  const msFactory = new MicroserviceFactory(configService);

  // const kafkaConsumerConfig = msFactory.createConfig({
  //   serviceName: MicroserviceName.UserService,
  //   transport: Transport.KAFKA,
  // } as MicroserviceConfigOptions);
  // await app.connectMicroservice<MicroserviceOptions>(kafkaConsumerConfig);

  const tcpListener = configService.get('tcp.userService');
  const tcpConfig = msFactory.createConfig({
    transport: Transport.TCP,
    options: {
      ...tcpListener,
    },
  } as unknown as MicroserviceConfigOptions);
  await app.connectMicroservice<MicroserviceOptions>(tcpConfig);

  await app.startAllMicroservices();
  await app.listen(appPort);

  logBootstrapInfo(app, {
    isProductionEnv,
    logger,
    appPort,
    tcpListener,
  });
}

bootstrap();
