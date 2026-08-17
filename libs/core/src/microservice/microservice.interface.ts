import { Type } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import {
  GrpcOptions,
  KafkaOptions,
  RmqOptions,
  TcpOptions,
} from '@nestjs/microservices/interfaces/microservice-configuration.interface';
import { MicroserviceName } from './microservice.enum';

export interface RmqMicroserviceOptions extends RmqOptions {
  serviceName: MicroserviceName;
}

export interface KafkaMicroserviceOptions extends KafkaOptions {
  serviceName: MicroserviceName;
}

export interface TCPMicroserviceOptions extends TcpOptions {
  serviceName: MicroserviceName;
}

/**
 * `service` names the service inside the .proto so `createClient()` can resolve
 * the typed stub. Stripped before the options reach Nest.
 */
export interface GrpcMicroserviceOptions extends Omit<GrpcOptions, 'options'> {
  serviceName: MicroserviceName;
  options: GrpcOptions['options'] & { service?: string };
}

export type MicroserviceConfigOptions =
  | RmqMicroserviceOptions
  | KafkaMicroserviceOptions
  | TCPMicroserviceOptions
  | GrpcMicroserviceOptions;

export type SupportedTransport =
  | Transport.KAFKA
  | Transport.RMQ
  | Transport.TCP
  | Transport.GRPC;

export interface MicroserviceClientDefinition {
  name: MicroserviceName;
  transport: SupportedTransport;
  options?: any;
}

export interface MicroserviceClientAsyncDefinition {
  name: MicroserviceName;
  transport: SupportedTransport;

  useFactory: (
    ...args: any[]
  ) =>
    | MicroserviceClientDefinition['options']
    | Promise<MicroserviceClientDefinition['options']>;
  inject?: (Type<any> | string | symbol)[];
}
