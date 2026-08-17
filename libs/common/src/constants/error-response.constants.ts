import { HttpStatus } from '@nestjs/common';

export const ERROR_RESPONSE = {
  INTERNAL_SERVER_ERROR: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: 'internal_server_error',
    message: `Internal Server Error`,
  },
  // Transport-level failures reaching a caller through BaseService.msResponse:
  // the downstream service is unreachable, or it did not answer in time.
  SERVICE_UNAVAILABLE: {
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    errorCode: 'service_unavailable',
    message: 'Service temporarily unavailable. Please try again later',
  },
  GATEWAY_TIMEOUT: {
    statusCode: HttpStatus.GATEWAY_TIMEOUT,
    errorCode: 'gateway_timeout',
    message: 'The request took too long to complete. Please try again',
  },
  UNAUTHORIZED: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 'unauthorized',
    message: 'Authentication required',
  },
  BAD_REQUEST: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 'bad_request',
    message: `Bad Request`,
  },
  INVALID_CREDENTIALS: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 'invalid_credentials',
    message: 'Incorrect email or password. Please check your credentials and try again',
  },
  INVALID_EMAIL: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 'invalid_email',
    message: 'Invalid email',
    errorField: 'email',
  },
  RESOURCE_FORBIDDEN: {
    statusCode: HttpStatus.FORBIDDEN,
    errorCode: 'resource_forbidden',
    message: 'Access denied',
  },
  RESOURCE_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'resource_not_found',
    message: 'Resource not found',
  },
  RESOURCE_ALREADY_EXISTED: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 'resource_already_existed',
    message: 'Resource already existed',
  },
  USER_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'user_not_found',
    message: 'User not found',
  },
  INVALID_PASSWORD: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 'invalid_password',
    message: 'The current password is incorrect',
    errorField: 'currentPassword',
  },
  PASSWORD_NOT_CHANGED: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 'password_not_changed',
    message: 'New password cannot be the same as the old password',
    errorField: 'newPassword',
  },
  UNPROCESSABLE_ENTITY: {
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    errorCode: 'unprocessable_entity',
    message: `Unprocessable entity`,
  },
  REQUEST_PAYLOAD_VALIDATION_ERROR: {
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    errorCode: 'request_payload_validation_error',
    message: 'Invalid request payload data',
  },
  INVALID_FILES: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 'invalid_files',
    message: `Invalid files`,
  },
  USER_ALREADY_EXISTS: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 'user_already_exists',
    message: 'Unable to create account with provided credentials',
  },
  EMAIL_NOT_VERIFIED: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 'email_not_verified',
    message: 'Email not verified',
  },
  USER_DEACTIVATED: {
    statusCode: HttpStatus.FORBIDDEN,
    errorCode: 'user_deactivated',
    message: 'Account access denied',
  },
  MAXIMUM_EMAIL_RESEND: {
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
    errorCode: 'maximum_email_resend',
    message: 'Maximum email resend',
  },
  LINK_EXPIRED: {
    statusCode: HttpStatus.GONE,
    errorCode: 'verification_link_expired',
    message: 'Verification link has expired',
  },
};
