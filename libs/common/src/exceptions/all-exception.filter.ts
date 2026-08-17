import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import _ from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable, throwError } from 'rxjs';
import { Logger } from 'winston';
import { ERROR_RESPONSE } from '../constants';
import { HttpErrorResponseDto } from '../dto';
import { NodeEnv } from '../enums';
import { convertErrorToObject, httpToGrpcStatus } from '../utilities';

/** gRPC trailers are capped around 8KB; stay well under it. */
const GRPC_MAX_ERROR_PAYLOAD_BYTES = 4096;

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(
    @Optional() private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): Observable<any> {
    // Determine the context before touching the HTTP adapter: an RPC call has
    // no request/response object and `ctx.getRequest()` returns the raw payload.
    const isRpcContext = host.getType() === 'rpc';

    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus resolve it here.
    const httpAdapter = this.httpAdapterHost?.httpAdapter;
    const ctx = isRpcContext ? undefined : host.switchToHttp();
    const request = ctx?.getRequest();
    const response = ctx?.getResponse();
    const isHttpException = exception instanceof HttpException;
    const microserviceName = this.configService.get<string>('app.microserviceName');

    const httpStatus = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorData: Partial<HttpErrorResponseDto> = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: request?.url,
    };

    if (isHttpException) {
      let exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        exceptionResponse = { message: exceptionResponse };
      }
      _.assign(
        errorData,
        {
          statusCode: exception.getStatus(),
          errorService: microserviceName,
        },
        exceptionResponse,
      );
    } else {
      this.logger.error({
        context: `AllExceptionFilter.catch`,
        error: exception,
        message: `A non-http error being throw somewhere`,
      });

      const rpcError = exception as any;
      _.assign(errorData, {
        statusCode:
          rpcError?.statusCode || ERROR_RESPONSE.INTERNAL_SERVER_ERROR.statusCode,
        message: rpcError?.message || ERROR_RESPONSE.INTERNAL_SERVER_ERROR.message,
        errorCode: rpcError?.errorCode || ERROR_RESPONSE.INTERNAL_SERVER_ERROR.errorCode,
        errorService: microserviceName,
        details: convertErrorToObject(exception),
      });
    }

    // ★ Attach the error to the request for use in middleware logging
    if (response) (response as any).error = exception;

    // Remove error details in production
    const nodeEnv = this.configService.get<NodeEnv>('appCommon.nodeEnv');
    const isCriticalEnv = [NodeEnv.Production, NodeEnv.Staging].includes(nodeEnv);
    if (isCriticalEnv) delete errorData.details;

    if (isRpcContext) {
      // For an HttpException, `details` is caller-facing and small (per-field
      // validation messages); it travels. Otherwise it is the serialised stack,
      // which is large and useless to the caller — it stays behind, already
      // logged above. The size check backstops an unexpectedly fat payload.
      const withoutDetails = () => {
        const { details: _stack, ...rest } = errorData;
        return rest;
      };

      let wireEnvelope = isHttpException ? errorData : withoutDetails();
      let payload = JSON.stringify(wireEnvelope);

      if (Buffer.byteLength(payload) > GRPC_MAX_ERROR_PAYLOAD_BYTES) {
        wireEnvelope = withoutDetails();
        payload = JSON.stringify(wireEnvelope);
      }

      // grpc-js reads `code` and `details` off the error object itself, so they
      // must sit at the top level; wrapping them in an RpcException buries them
      // and every error degrades to UNKNOWN(2). Spreading errorData alongside
      // keeps transports that serialise the whole object working.
      return throwError(() => ({
        ...errorData,
        code: httpToGrpcStatus(errorData.statusCode ?? httpStatus),
        details: payload,
      }));
    }

    if (!response.headersSent) {
      if (httpAdapter) {
        httpAdapter.reply(ctx.getResponse(), errorData, httpStatus);
      } else {
        response.status(httpStatus).json(errorData);
      }
    } else {
      this.logger.warn('Response already sent, skipping error response', {
        url: request.url,
        method: request.method,
      });
    }
  }
}
