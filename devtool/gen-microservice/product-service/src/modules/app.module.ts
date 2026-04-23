import {
  AllExceptionFilter,
  appCommonConfiguration,
  getWinstonConfig,
  HttpLoggerMiddleware,
  kafkaConfiguration,
  rabbitmqConfiguration,
  s3Configuration,
  tcpConfiguration,
} from '@app/common';
import { MicroserviceModule, MicroserviceName } from '@app/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { WinstonModule } from 'nest-winston';
import { appConfiguration, dbConfiguration } from 'src/config';
import { BaseRepository } from 'src/data-access/base.repository';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product';

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
        appConfiguration,
        dbConfiguration,
        rabbitmqConfiguration,
        kafkaConfiguration,
        tcpConfiguration,
        s3Configuration,
        appCommonConfiguration,
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
        appCommonConfig: ConfigType<typeof appCommonConfiguration>,
      ) => {
        return getWinstonConfig(appConfig.appName, appCommonConfig.nodeEnv);
      },
      inject: [appConfiguration.KEY, appCommonConfiguration.KEY],
    }),
    MicroserviceModule.registerAsync([
      {
        name: MicroserviceName.MerchantService,
        transport: Transport.TCP,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          return {}; // return { ...configService.get('abc.xyz') };
        },
      },
    ]),
    // Business Logic Modules
    ProductModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
