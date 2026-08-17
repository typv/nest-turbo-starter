import { Observable } from 'rxjs';

/** Wire contract for `proto/notification.proto`. */

export interface ForgotPasswordRequest {
  email: string;
  name: string;
  resetPasswordUrl: string;
}

export interface SendMailResponse {
  success: boolean;
}

export interface NotificationGrpcService {
  sendForgotPasswordMail(request: ForgotPasswordRequest): Observable<SendMailResponse>;
}
