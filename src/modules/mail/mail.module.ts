import { Module } from '@nestjs/common';
import { SendGridMailerService } from './adapters/sendgrid-mailer.service.js';
import { MailerPort } from './ports/mailer.port.js';

@Module({
  providers: [
    {
      provide: MailerPort,
      useClass: SendGridMailerService,
    },
  ],
  exports: [MailerPort],
})
export class MailModule {}
