import { codeExpiresConfiguration } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SendMailConsumer } from './send-mail.consumer';
import { SendMailService } from './send-mail.service';

@Module({
  imports: [ConfigModule.forRoot({ load: [codeExpiresConfiguration] })],
  controllers: [SendMailConsumer],
  providers: [SendMailService],
  exports: [SendMailService],
})
export class SendMailModule {}
