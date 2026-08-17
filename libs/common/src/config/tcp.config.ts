import { registerAs } from '@nestjs/config';

/**
 * Optional TCP transport, off by default — internal calls use gRPC.
 *
 * Nothing here has a default: opting a service into `Transport.TCP` means
 * setting `TCP_*_HOST` / `TCP_*_PORT` explicitly, on ports that do not clash
 * with the gRPC listeners. See docs/service-communication.md.
 */
export const tcpConfiguration = registerAs('tcp', () => ({
  userService: {
    host: process.env.TCP_USER_SERVICE_HOST,
    port: Number(process.env.TCP_USER_SERVICE_PORT) || undefined,
  },
  notificationService: {
    host: process.env.TCP_NOTIFICATION_SERVICE_HOST,
    port: Number(process.env.TCP_NOTIFICATION_SERVICE_PORT) || undefined,
  },
}));
