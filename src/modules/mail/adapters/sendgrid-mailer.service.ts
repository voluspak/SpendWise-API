import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import { config } from '../../../config/app/index.js';
import { MailerPort, PasswordResetEmailInput } from '../ports/mailer.port.js';

const { sendgrid } = config;

@Injectable()
export class SendGridMailerService extends MailerPort {
  private readonly logger = new Logger(SendGridMailerService.name);

  constructor() {
    super();
    sgMail.setApiKey(config.sendgrid.api.key);
  }

  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    try {
      await sgMail.send({
        to: input.to,
        from: {
          email: sendgrid.from.email,
          name: sendgrid.from.name,
        },
        templateId: sendgrid.template.id,
        dynamicTemplateData: {
          first_name: input.firstName,
          last_name: input.lastName,
          link: input.resetUrl,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error enviando email de recuperación a ${input.to}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
