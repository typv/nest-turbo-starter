import { ERROR_RESPONSE, GrpcStatus, grpcToHttpStatus } from '@app/common';
import { HttpException } from '@nestjs/common';
import { catchError, lastValueFrom, Observable, timeout } from 'rxjs';

/**
 * Extract the provider's error envelope, if there is one. A numeric
 * `statusCode` is what identifies it — without that check any message that
 * merely happens to be JSON would be mistaken for an envelope, and the real
 * gRPC status code discarded.
 */
function parseErrorEnvelope(err: any): Record<string, any> | null {
  const raw = err?.details ?? err?.message;
  if (typeof raw !== 'string' || !raw.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(raw);
    const isEnvelope =
      parsed && typeof parsed === 'object' && typeof parsed.statusCode === 'number';
    return isEnvelope ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Classify a failure that carries no provider envelope. A deadline is a gateway
 * timeout whether the peer enforced it (`DEADLINE_EXCEEDED`) or `timeout()` did
 * here (`TimeoutError`).
 */
function transportFailureResponse(err: any) {
  if (err?.name === 'TimeoutError' || err?.code === GrpcStatus.DEADLINE_EXCEEDED) {
    return ERROR_RESPONSE.GATEWAY_TIMEOUT;
  }

  if (err?.code === GrpcStatus.UNAVAILABLE) {
    return ERROR_RESPONSE.SERVICE_UNAVAILABLE;
  }

  if (err?.code !== undefined) {
    return {
      ...ERROR_RESPONSE.INTERNAL_SERVER_ERROR,
      statusCode: grpcToHttpStatus(err.code),
    };
  }

  return ERROR_RESPONSE.INTERNAL_SERVER_ERROR;
}

/**
 * Await a microservice call and normalise its failure into an HttpException.
 *
 * An error arrives as `{ code, details, message }`. The provider's
 * AllExceptionFilter puts a `{ statusCode, errorCode, errorService }` envelope
 * into `details` as JSON, which is replayed verbatim so the caller's HTTP
 * response matches what the provider intended. Failures without that envelope
 * never reached the provider and are classified from the gRPC status instead.
 *
 * Every caller of a microservice stub should go through this — services via
 * `BaseService.msResponse`, and passport strategies directly — so a downstream
 * outage is reported the same way whichever path hit it.
 */
export async function callMicroservice<T = any>(
  res: Observable<T>,
  timeoutMs?: number,
): Promise<T> {
  const callTimeout = timeoutMs || +process.env.CALL_SERVICE_TIMEOUT;

  const pipe = res.pipe(
    timeout(callTimeout),
    catchError((err) => {
      const envelope = parseErrorEnvelope(err);

      if (envelope) {
        const statusCode =
          envelope.statusCode || ERROR_RESPONSE.INTERNAL_SERVER_ERROR.statusCode;
        throw new HttpException(
          {
            statusCode,
            message: envelope.message || ERROR_RESPONSE.INTERNAL_SERVER_ERROR.message,
            errorCode:
              envelope.errorCode || ERROR_RESPONSE.INTERNAL_SERVER_ERROR.errorCode,
            errorService: envelope.errorService,
            // Field-level context, e.g. which properties failed validation.
            // Stripped by the provider's filter in production.
            details: envelope.details,
            stack: envelope.stack,
            trace: envelope.trace,
          },
          statusCode,
        );
      }

      const fallback = transportFailureResponse(err);
      const statusCode = err?.statusCode || fallback.statusCode;

      throw new HttpException(
        {
          statusCode,
          // grpc-js sets `message` (status-prefixed) and `details` (raw);
          // fall back to details so a provider message is never dropped.
          message: err?.message || err?.details || fallback.message,
          errorCode: err?.errorCode || fallback.errorCode,
          errorService: err?.errorService,
          stack: err?.stack,
          trace: err?.trace,
        },
        statusCode,
      );
    }),
  );

  return lastValueFrom(pipe);
}
