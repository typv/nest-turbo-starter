import {
  AllExceptionFilter,
  appCommonConfiguration,
  getWinstonConfig,
  HttpLoggerMiddleware,
  kafkaConfiguration,
  rabbitmqConfiguration,
  tcpConfiguration,
} from '@app/common';
import { AwsS3Module, RedisModule } from '@app/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { appConfiguration, dbConfiguration } from 'src/config';
import { BaseRepository } from 'src/data-access/base.repository';
import { RoleBasedAccessControlGuard } from 'src/guards/rbac.guard';
import { UploadModule } from 'src/modules/upload';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth';
import { UserModule } from './user';
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
        dbConfiguration,
        rabbitmqConfiguration,
        kafkaConfiguration,
        tcpConfiguration,
      ],
    }),
    MikroOrmModule.forRootAsync({
      useFactory: (dbConfig: ConfigType<typeof dbConfiguration>) => {
        return {
          ...dbConfig,
          entityRepository: BaseRepository,
        };
      },
      inject: [dbConfiguration.KEY],
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
    UploadModule,
    // Business Logic Modules
    UserModule,
    AuthModule,
    AwsS3Module,
    RedisModule,
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
