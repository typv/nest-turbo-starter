import {
  AllExceptionFilter,
  appCommonConfiguration,
  getWinstonConfig,
  kafkaConfiguration,
  rabbitmqConfiguration,
  tcpConfiguration,
} from '@app/common';
import { HttpLoggerMiddleware } from '@app/common';
import { RedisModule } from '@app/core';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { appConfiguration } from 'src/config';
import { RoleBasedAccessControlGuard } from 'src/guards/rbac.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth';
import { EmailModule } from './email';
import { SendMailModule } from './send-mail';
import { AppAuthGuard } from '../guards/app-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // validationSchema,
      validationOptions: {
        abortEarly: false,
      },
      load: [
        appCommonConfiguration,
        appConfiguration,
        rabbitmqConfiguration,
        kafkaConfiguration,
        tcpConfiguration,
      ],
    }),
    WinstonModule.forRootAsync({
      useFactory: (
        appConfig: ConfigType<typeof appConfiguration>,
        appCommonConfig: ConfigType<typeof appCommonConfiguration>
      ) => {
        return getWinstonConfig(appConfig.appName, appCommonConfig.isProductionEnv);
      },
      inject: [appConfiguration.KEY, appCommonConfiguration.KEY],
    }),
    // BullModule.forRootAsync({
    //   imports: [RedisModule],
    //   useFactory: (redisClient: IORedis) => ({
    //     connection: redisClient,
    //   }),
    //   inject: [REDIS_CLIENT],
    // }),
    // BullBoardModule.forRootAsync({
    //   useFactory: (appConfig: ConfigType<typeof appConfiguration>) => ({
    //     route: '/queues',
    //     adapter: ExpressAdapter,
    //     middleware: basicAuth({
    //       challenge: true,
    //       users: { admin: appConfig.queueDashboardPassword },
    //     }),
    //   }),
    //   inject: [appConfiguration.KEY],
    // }),
    // MicroserviceModule.registerAsync([
    //   {
    //     name: MicroserviceName.UserService,
    //     transport: Transport.TCP,
    //     inject: [ConfigService],
    //     useFactory: (configService: ConfigService) => {
    //       const userTcpURLConfig = configService.get('tcp.userService');
    //       return {
    //         ...userTcpURLConfig,
    //       };
    //     },
    //   },
    // ]),
    // Business Logic Modules
    AuthModule,
    SendMailModule,
    RedisModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AppAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleBasedAccessControlGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
