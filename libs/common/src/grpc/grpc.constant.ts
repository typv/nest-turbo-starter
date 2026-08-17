import { join } from 'path';

/** Service names as declared in the .proto files. */
export const USER_GRPC_SERVICE = 'UserService';
export const NOTIFICATION_GRPC_SERVICE = 'NotificationService';

/**
 * proto-loader reads these from disk at runtime. tsc does not copy non-TS
 * files, so `@app/common`'s build mirrors `src/grpc/proto/` into
 * `dist/grpc/proto/`, keeping `./proto` valid in both trees.
 */
const PROTO_DIR = join(__dirname, 'proto');

export const USER_PROTO_PATH = join(PROTO_DIR, 'user.proto');
export const NOTIFICATION_PROTO_PATH = join(PROTO_DIR, 'notification.proto');

/**
 * `defaults: false` leaves absent optional fields undefined rather than
 * substituting "" / false / 0.
 *
 * `oneofs: false` because proto3 `optional` compiles to a synthetic oneof;
 * enabling it decorates every populated optional field with a stray
 * `_fieldName` key. No real oneofs are declared here.
 */
export const GRPC_LOADER_OPTIONS = {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: false,
  oneofs: false,
  arrays: true,
  objects: true,
} as const;
