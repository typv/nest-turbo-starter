import { renderEmail, ResetYourPasswordEmail } from '@app/email-template';
import { Injectable } from '@nestjs/common';
import { AbstractEmailService } from './abstract-email.service';
import { EMAIL_SUBJECT } from './email.constants';
import { ForgotPasswordDto } from '../send-mail/dto/forgot-password.dto';

@Injectable()
export class EmailService {
  constructor(private readonly emailService: AbstractEmailService) {}

  async forgotPasswordMailer(payload: ForgotPasswordDto): Promise<void> {
    const htmlContent = await renderEmail(ResetYourPasswordEmail, payload);
    await this.emailService.sendEmail({
      to: payload.email,
      subject: EMAIL_SUBJECT.RESET_PASSWORD,
      htmlContent,
    });
  }
}
