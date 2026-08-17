import {
  AllExceptionFilter,
  ForgotPasswordRequest,
  NOTIFICATION_GRPC_SERVICE,
  SendMailResponse,
} from '@app/common';
import { Controller, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { EmailService } from '../email';

@UseFilters(AllExceptionFilter)
@Controller()
export class SendMailConsumer {
  constructor(private readonly emailService: EmailService) {}

  @GrpcMethod(NOTIFICATION_GRPC_SERVICE, 'SendForgotPasswordMail')
  async sendMail(data: ForgotPasswordRequest): Promise<SendMailResponse> {
    await this.emailService.forgotPasswordMailer(data);
    return { success: true };
  }
}
