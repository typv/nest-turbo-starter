import { kafkaConfiguration, rabbitmqConfiguration } from '@app/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { CustomClientOptions, Transport } from '@nestjs/microservices';
import {
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

  public createConfig(options: MicroserviceConfigOptions): CustomClientOptions {
    switch (options.transport) {
      case Transport.RMQ:
        return this.createRmqConfig(options as RmqMicroserviceOptions);

      case Transport.KAFKA:
        return this.createKafkaConfig(options as KafkaMicroserviceOptions);

      case Transport.TCP:
        return this.createTCPConfig(options as TCPMicroserviceOptions);

      default:
        throw new Error(`MicroserviceFactory: Unsupported transport type`);
    }
  }
}
