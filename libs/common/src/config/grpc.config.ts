import { registerAs } from '@nestjs/config';
import {
  NOTIFICATION_GRPC_SERVICE,
  NOTIFICATION_PROTO_PATH,
  USER_GRPC_SERVICE,
  USER_PROTO_PATH,
} from '../grpc';

/**
 * Transport settings for internal service-to-service calls, consumed by both
 * the listener in each `main.ts` and the client registration in each
 * `app.module.ts`. Host and port are separate in the environment and joined
 * into the single `host:port` string gRPC expects.
 *
 * Clients dial the same `0.0.0.0` the server binds to, which resolves to
 * loopback locally. Across hosts or containers they must target a real hostname.
 */
export const grpcConfiguration = registerAs('grpc', () => ({
  userService: {
    url: `${process.env.GRPC_USER_SERVICE_HOST}:${process.env.GRPC_USER_SERVICE_PORT}`,
    // matches `package user;` in user.proto
    package: 'user',
    protoPath: USER_PROTO_PATH,
    service: USER_GRPC_SERVICE,
  },
  notificationService: {
    url: `${process.env.GRPC_NOTIFICATION_SERVICE_HOST}:${process.env.GRPC_NOTIFICATION_SERVICE_PORT}`,
    // matches `package notification;` in notification.proto
    package: 'notification',
    protoPath: NOTIFICATION_PROTO_PATH,
    service: NOTIFICATION_GRPC_SERVICE,
  },
}));
