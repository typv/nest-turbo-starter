import { HttpStatus } from '@nestjs/common';

/**
 * gRPC status codes (grpc-js `status` enum), inlined so @app/common does not
 * need a runtime dependency on @grpc/grpc-js just for two lookup tables.
 */
export enum GrpcStatus {
  OK = 0,
  CANCELLED = 1,
  UNKNOWN = 2,
  INVALID_ARGUMENT = 3,
  DEADLINE_EXCEEDED = 4,
  NOT_FOUND = 5,
  ALREADY_EXISTS = 6,
  PERMISSION_DENIED = 7,
  RESOURCE_EXHAUSTED = 8,
  FAILED_PRECONDITION = 9,
  ABORTED = 10,
  INTERNAL = 13,
  UNAVAILABLE = 14,
  UNAUTHENTICATED = 16,
}

const HTTP_TO_GRPC: Partial<Record<HttpStatus, GrpcStatus>> = {
  [HttpStatus.BAD_REQUEST]: GrpcStatus.INVALID_ARGUMENT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: GrpcStatus.INVALID_ARGUMENT,
  [HttpStatus.UNAUTHORIZED]: GrpcStatus.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: GrpcStatus.PERMISSION_DENIED,
  [HttpStatus.NOT_FOUND]: GrpcStatus.NOT_FOUND,
  [HttpStatus.CONFLICT]: GrpcStatus.ALREADY_EXISTS,
  [HttpStatus.PRECONDITION_FAILED]: GrpcStatus.FAILED_PRECONDITION,
  [HttpStatus.TOO_MANY_REQUESTS]: GrpcStatus.RESOURCE_EXHAUSTED,
  [HttpStatus.REQUEST_TIMEOUT]: GrpcStatus.DEADLINE_EXCEEDED,
  [HttpStatus.SERVICE_UNAVAILABLE]: GrpcStatus.UNAVAILABLE,
};

const GRPC_TO_HTTP: Partial<Record<GrpcStatus, HttpStatus>> = {
  [GrpcStatus.INVALID_ARGUMENT]: HttpStatus.BAD_REQUEST,
  [GrpcStatus.UNAUTHENTICATED]: HttpStatus.UNAUTHORIZED,
  [GrpcStatus.PERMISSION_DENIED]: HttpStatus.FORBIDDEN,
  [GrpcStatus.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [GrpcStatus.ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [GrpcStatus.FAILED_PRECONDITION]: HttpStatus.PRECONDITION_FAILED,
  [GrpcStatus.RESOURCE_EXHAUSTED]: HttpStatus.TOO_MANY_REQUESTS,
  [GrpcStatus.DEADLINE_EXCEEDED]: HttpStatus.REQUEST_TIMEOUT,
  [GrpcStatus.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [GrpcStatus.CANCELLED]: HttpStatus.REQUEST_TIMEOUT,
};

export function httpToGrpcStatus(httpStatus: number): GrpcStatus {
  return HTTP_TO_GRPC[httpStatus as HttpStatus] ?? GrpcStatus.INTERNAL;
}

export function grpcToHttpStatus(grpcStatus: number): HttpStatus {
  return GRPC_TO_HTTP[grpcStatus as GrpcStatus] ?? HttpStatus.INTERNAL_SERVER_ERROR;
}
