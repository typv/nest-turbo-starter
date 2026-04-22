import { kafkaConfiguration, rabbitmqConfiguration } from '@app/common';
import { DynamicModule, FactoryProvider, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientOptions, ClientProxyFactory } from '@nestjs/microservices';
import { MS_INJECTION_TOKEN } from './microservice.constant';
import { MicroserviceFactory } from './microservice.factory';
import {
  MicroserviceClientAsyncDefinition,
  MicroserviceClientDefinition,
} from './microservice.interface';

@Module({})
export class MicroserviceModule {
  private static createClientProvider(
    client: MicroserviceClientDefinition,
  ): FactoryProvider {
    const uniqueProvideToken = MS_INJECTION_TOKEN(client.name, client.transport);

    return {
      provide: uniqueProvideToken,
      useFactory: (msFactory: MicroserviceFactory) => {
        const clientOptions = msFactory.createConfig({
          serviceName: client.name,
          transport: client.transport,
          options: client?.options,
        });
        return ClientProxyFactory.create(clientOptions as ClientOptions);
      },
      inject: [MicroserviceFactory],
    };
  }

  static register(clients: MicroserviceClientDefinition[]): DynamicModule {
    const clientProviders: FactoryProvider[] = clients.map(this.createClientProvider);

    return {
      global: true,
      module: MicroserviceModule,
      imports: [
        ConfigModule.forFeature(rabbitmqConfiguration),
        ConfigModule.forFeature(kafkaConfiguration),
      ],
      providers: [
        {
          provide: MicroserviceFactory,
          useFactory: (configService: ConfigService) =>
            new MicroserviceFactory(configService),
          inject: [ConfigService],
        },
        ...clientProviders,
      ],
      exports: clientProviders.map((p) => p.provide),
    };
  }

  static registerAsync(clients: MicroserviceClientAsyncDefinition[]): DynamicModule {
    const asyncProviders: Provider[] = clients.map((client) => ({
      provide: `${client.name}_${client.transport}_ASYNC_CONFIG`,
      useFactory: client.useFactory,
      inject: client.inject || [],
    }));

    const clientProviders: FactoryProvider[] = clients.map((client) => {
      const uniqueProvideToken = MS_INJECTION_TOKEN(client.name, client.transport);
      const asyncConfigToken = `${client.name}_${client.transport}_ASYNC_CONFIG`;

      return {
        provide: uniqueProvideToken,
        useFactory: (
          msFactory: MicroserviceFactory,
          resolvedOptions: ClientOptions['options'],
        ) => {
          const clientOptions: ClientOptions = {
            transport: client.transport,
            options: resolvedOptions,
          } as ClientOptions;

          return ClientProxyFactory.create(clientOptions);
        },
        inject: [MicroserviceFactory, asyncConfigToken],
      };
    });
    const allProviders = [...asyncProviders, ...clientProviders];

    return {
      global: true,
      module: MicroserviceModule,
      imports: [
        ConfigModule.forFeature(rabbitmqConfiguration),
        ConfigModule.forFeature(kafkaConfiguration),
      ],
      providers: [
        {
          provide: MicroserviceFactory,
          useFactory: (configService: ConfigService) =>
            new MicroserviceFactory(configService),
          inject: [ConfigService],
        },
        ...allProviders,
      ],
      exports: clientProviders.map((p) => p.provide),
    };
  }
}
