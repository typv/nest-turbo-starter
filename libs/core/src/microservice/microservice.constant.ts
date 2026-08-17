import { Transport } from '@nestjs/microservices';
import { MicroserviceName } from './microservice.enum';

export const MS_INJECTION_TOKEN_SUFFIX = {
  [Transport.KAFKA]: '_KafkaClient',
  [Transport.RMQ]: '_RQMClient',
  [Transport.TCP]: '_TCPClient',
  [Transport.GRPC]: '_GrpcClient',
} as const;

export const MS_INJECTION_TOKEN = (
  serviceName: MicroserviceName,
  transportType: Transport,
) => {
  if (!MS_INJECTION_TOKEN_SUFFIX[transportType]) {
    throw new Error(`MS_INJECTION_TOKEN: Unsupported transport type: ${transportType}`);
  }
  return serviceName + MS_INJECTION_TOKEN_SUFFIX[transportType];
};
