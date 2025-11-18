import { AllExceptionFilter, NotificationMessagePattern } from '@app/common';
import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { EmailService } from '../email';

@UseFilters(AllExceptionFilter)
@Controller()
export class SendMailConsumer {
  constructor(private readonly emailService: EmailService) {}

  @MessagePattern(NotificationMessagePattern.FORGOT_PASSWORD)
  async sendMail(data: ForgotPasswordDto): Promise<{ success: boolean }> {
    await this.emailService.forgotPasswordMailer(data);
    return { success: true };
  }
}
