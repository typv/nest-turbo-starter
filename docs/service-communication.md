# Service Communication

How the three services talk to each other, which ports they use, and what to change if you swap the transport.

---

## Overview

External traffic reaches the services over **HTTP**, routed by Apache APISIX (or Kong). Internal service-to-service calls use **gRPC**.

```
                 ┌──────────────┐
   client ─────▶ │   APISIX     │  HTTP
                 └──────┬───────┘
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
   ┌────────────┐ ┌────────────┐ ┌──────────────────┐
   │auth-service│ │user-service│ │notification-svc  │
   │  (client)  │ │  (server)  │ │(server + client) │
   └─────┬──────┘ └─────▲──────┘ └────┬──────▲──────┘
         │  gRPC        │             │      │
         └──────────────┴─────────────┘      │
         └───────────────── gRPC ────────────┘
```

- **auth-service** — HTTP only. Never listens for RPC; it is purely a gRPC *client* of the other two.
- **user-service** — HTTP + gRPC listener. Owns the `User` entity.
- **notification-service** — HTTP + gRPC listener, and a gRPC client of user-service.

---

## Ports

| Service | HTTP | gRPC | Env vars |
|---|---|---|---|
| auth-service | 3300 | — (client only) | `AUTH_SERVICE_APP_PORT` |
| user-service | 3301 | **3311** | `USER_SERVICE_APP_PORT`, `GRPC_USER_SERVICE_HOST/PORT` |
| notification-service | 3303 | **3313** | `NOTIFICATION_SERVICE_APP_PORT`, `GRPC_NOTIFICATION_SERVICE_HOST/PORT` |

> ⚠️ **Note:**
> - Clients dial the same `0.0.0.0` the server binds to. That works locally because the OS resolves it to loopback. Once services run on separate hosts or containers, clients must point at a real hostname.
> - Any new env var must also be added to `globalEnv` in `turbo.json`, or it will not reach the tasks.

---

## Using TCP instead of gRPC

`MicroserviceFactory` supports TCP; it is simply not the default.

> ⚠️ **If you switch a service to TCP, you must set its port explicitly.**
> There are no defaults. `tcp.config.ts` reads `TCP_*_HOST` / `TCP_*_PORT` and leaves them `undefined` when unset, and **3311 / 3313 belong to gRPC** — reusing them collides with the running gRPC listener.

Pick free ports, e.g.:

```bash
TCP_USER_SERVICE_HOST=0.0.0.0
TCP_USER_SERVICE_PORT=3411
TCP_NOTIFICATION_SERVICE_HOST=0.0.0.0
TCP_NOTIFICATION_SERVICE_PORT=3413
```

Then change the transport on the listener in the service's `main.ts`:

```ts
const tcpListener = configService.get('tcp.userService');
const tcpConfig = msFactory.createConfig({
  serviceName: MicroserviceName.UserService,
  transport: Transport.TCP,
  options: { ...tcpListener },
} as unknown as MicroserviceConfigOptions);
await app.connectMicroservice<MicroserviceOptions>(tcpConfig);
```

…and match it on every client in `app.module.ts`:

```ts
MicroserviceModule.registerAsync([
  {
    name: MicroserviceName.UserService,
    transport: Transport.TCP,
    inject: [ConfigService],
    useFactory: (cs: ConfigService) => ({ ...cs.get('tcp.userService') }),
  },
]);
```

Two things change with the handlers as well: swap `@GrpcMethod(...)` for `@MessagePattern(...)`, and inject `ClientProxy` instead of the typed stub — `MS_INJECTION_TOKEN` builds a different token per transport, so `Transport.TCP` and `Transport.GRPC` are distinct providers.

Kafka and RabbitMQ are wired into the same factory and can be enabled the same way; both have scaffolding in `main.ts` and `docker-compose.yml`, currently commented out.

---

## The service contract

`.proto` files and the matching TypeScript interfaces live together in `libs/common/src/grpc/`. Both the provider and the consumers import from `@app/common`, so a change to the shape breaks compilation on every side instead of only at runtime.

```
libs/common/src/grpc/
├── proto/
│   ├── user.proto
│   └── notification.proto
├── grpc.constant.ts                  # service names, proto paths, loader options
├── user-grpc.interface.ts
└── notification-grpc.interface.ts
```

### Adding an RPC

1. Add the `rpc` and its messages to the relevant `.proto`.
2. Add the matching request/response interfaces and the method signature to the `*-grpc.interface.ts` service interface.
3. Implement it on the provider with `@GrpcMethod(SERVICE_NAME, 'MethodName')`.
4. Call it from the consumer — the injected stub is typed, so a mismatch fails the build.

### Conventions

- **Dates cross the wire as ISO 8601 strings.** proto3 has no date type. Convert to `Date` on the provider side before handing values to MikroORM.
- **Nullable fields are declared `optional`** so proto3 field presence applies and the loader does not substitute `""` / `false` for absent values (`defaults: false` in `GRPC_LOADER_OPTIONS`).
- **Enums (`Role`, `Gender`) are plain `string`** in the proto — they are TypeScript string enums, so no mapping is needed.
- **`UserResponse.password` carries the bcrypt hash.** auth-service verifies credentials locally, so `GetUser` and `FindUserByEmail` return it; `toUserResponse()` in `apps/user-service/src/modules/user/user.mapper.ts` withholds it from every other caller. A `VerifyCredentials` RPC on user-service would remove the need for it to travel at all.

### Runtime proto resolution

`@grpc/proto-loader` reads `.proto` files from disk at runtime, not at build time — and `tsc` does not copy non-TS files. So `@app/common`'s `build` script mirrors `src/grpc/proto/` into `dist/grpc/proto/` via a `copy:proto` step, and `grpc.constant.ts` resolves `./proto` relative to its own emitted location. That lands correctly for both `pnpm dev` and `pnpm prod`.

Adding or renaming a `.proto` therefore needs a rebuild of `@app/common`, not just a restart. `start:dev` copies once before entering watch mode, so editing a `.proto` during a watch session also needs a restart.

---

## Error handling

An error raised in one service reaches the HTTP client with its original status, code and message.

1. A handler throws `ServerException` (an `HttpException`).
2. `AllExceptionFilter` detects the RPC context and emits an error carrying the mapped gRPC status (`httpToGrpcStatus`) plus a JSON envelope `{ statusCode, message, errorCode, errorService }` in `details`.
3. On the caller, `BaseService.msResponse()` parses that envelope and rebuilds the identical `HttpException`, including per-field `details` for validation failures.
4. Without an envelope the call never reached the provider: an unreachable peer becomes 503 `service_unavailable`, a deadline 504 `gateway_timeout`, anything else maps via `grpcToHttpStatus(err.code)`.

Mapping table: `libs/common/src/utilities/grpc-status.util.ts`.

`msResponse()` also applies the `CALL_SERVICE_TIMEOUT` deadline (default 30s).

---

## Related files

| Concern | Path |
|---|---|
| Transport factory & DI tokens | `libs/core/src/microservice/` |
| gRPC config | `libs/common/src/config/grpc.config.ts` |
| TCP config (optional) | `libs/common/src/config/tcp.config.ts` |
| Error envelope | `libs/common/src/exceptions/all-exception.filter.ts`, `libs/core/src/base/base.service.ts` |
| Providers | `apps/user-service/src/modules/user/user.consumer.ts`, `apps/notification-service/src/modules/send-mail/send-mail.consumer.ts` |
