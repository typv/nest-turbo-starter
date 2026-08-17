import {
  GRPC_LOADER_OPTIONS,
  kafkaConfiguration,
  rabbitmqConfiguration,
} from '@app/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import {
  ClientGrpc,
  ClientOptions,
  ClientProxy,
  ClientProxyFactory,
  CustomClientOptions,
  Transport,
} from '@nestjs/microservices';
import {
  GrpcMicroserviceOptions,
  KafkaMicroserviceOptions,
  MicroserviceConfigOptions,
  RmqMicroserviceOptions,
  TCPMicroserviceOptions,
} from './microservice.interface';

export class MicroserviceFactory {
  private kafkaConfig: ConfigType<typeof kafkaConfiguration>;
  private rabbitmqConfig: ConfigType<typeof rabbitmqConfiguration>;

  constructor(private readonly configService: ConfigService) {
    this.kafkaConfig = configService.get('kafka');
    this.rabbitmqConfig = configService.get('rabbitmq');
  }

  private createRmqConfig(rqmOptions: RmqMicroserviceOptions): CustomClientOptions {
    return {
      name: rqmOptions.serviceName,
      transport: rqmOptions.transport,
      options: rqmOptions.options,
    } as unknown as CustomClientOptions;
  }

  private createKafkaConfig(kafkaOptions: KafkaMicroserviceOptions): CustomClientOptions {
    const options: { [key: string]: any } = {
      client: {
        clientId: kafkaOptions.serviceName,
        brokers: this.kafkaConfig.brokers,
      },
      producer: {
        allowAutoTopicCreation: true,
        idempotent: true,
        maxInFlightRequests: 1, // must be 1 when idempotent=true to prevent out-of-order sequence errors
        acks: 1,
        // retry: {
        //   retries: 5,
        //   initialRetryTime: 300
        // },
      },
      consumer: {
        groupId: `${kafkaOptions.serviceName}_consumer`,
        allowAutoTopicCreation: true,
        heartbeatInterval: this.kafkaConfig.heartbeatInterval,
        sessionTimeout: this.kafkaConfig.sessionTimeout,
      },
    };

    if (this.kafkaConfig.saslEnabled) {
      options.client.ssl = true;
      options.client.sasl = {
        mechanism: this.kafkaConfig.saslMechanism,
        username: this.kafkaConfig.saslUsername,
        password: this.kafkaConfig.saslPassword,
      };
    }

    return {
      name: kafkaOptions.serviceName,
      transport: kafkaOptions.transport,
      options: options,
    } as unknown as CustomClientOptions;
  }

  private createTCPConfig(tcpOptions: TCPMicroserviceOptions): CustomClientOptions {
    return {
      name: tcpOptions.serviceName,
      transport: tcpOptions.transport,
      options: tcpOptions.options,
    } as unknown as CustomClientOptions;
  }

  private createGrpcConfig(grpcOptions: GrpcMicroserviceOptions): CustomClientOptions {
    return {
      name: grpcOptions.serviceName,
      transport: grpcOptions.transport,
      options: {
        // Applied first so callers can override individual loader options.
        loader: GRPC_LOADER_OPTIONS,
        ...grpcOptions.options,
      },
    } as unknown as CustomClientOptions;
  }

  public createConfig(options: MicroserviceConfigOptions): CustomClientOptions {
    switch (options.transport) {
      case Transport.RMQ:
        return this.createRmqConfig(options as RmqMicroserviceOptions);

      case Transport.KAFKA:
        return this.createKafkaConfig(options as KafkaMicroserviceOptions);

      case Transport.TCP:
        return this.createTCPConfig(options as TCPMicroserviceOptions);

      case Transport.GRPC:
        return this.createGrpcConfig(options as GrpcMicroserviceOptions);

      default:
        throw new Error(`MicroserviceFactory: Unsupported transport type`);
    }
  }

  /**
   * Build the injectable client for a set of options.
   *
   * gRPC is the odd one out: `ClientProxyFactory.create` returns a `ClientGrpc`
   * whose typed stub must be pulled out with `getService()`. Doing it here lets
   * consumers inject a ready-to-call service instead of wiring `onModuleInit`.
   */
  public createClient<T extends object = ClientProxy>(
    clientOptions: CustomClientOptions,
  ): T {
    // createConfig casts `{ name, transport, options }` to CustomClientOptions;
    // read them back through the same escape hatch.
    const { transport, options } = clientOptions as unknown as {
      transport: Transport;
      options?: Record<string, any>;
    };

    if (transport !== Transport.GRPC) {
      return ClientProxyFactory.create(clientOptions as ClientOptions) as unknown as T;
    }

    // `service` is ours, not Nest's — remove it before handing the options over.
    const { service, ...grpcOptions } = (options ?? {}) as {
      service?: string;
    };

    if (!service) {
      throw new Error(
        'MicroserviceFactory: gRPC client options must include a `service` name matching the .proto service',
      );
    }

    const client = ClientProxyFactory.create({
      ...clientOptions,
      options: grpcOptions,
    } as ClientOptions) as unknown as ClientGrpc;

    return client.getService<T>(service);
  }
}
