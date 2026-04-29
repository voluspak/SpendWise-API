export interface PasswordResetEmailInput {
  to: string;
  firstName: string;
  lastName: string;
  resetUrl: string;
}

export abstract class MailerPort {
  abstract sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void>;
}
