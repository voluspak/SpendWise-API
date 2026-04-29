jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
  },
}));

jest.mock('../../../config/app/index.js', () => ({
  config: {
    sendgrid: {
      api: { key: 'SG.test-key' },
      from: { email: 'no-reply@spendwise.test', name: 'SpendWise Test' },
      template: { id: { password: { reset: 'd-template-id-123' } } },
    },
  },
}));

import sgMail from '@sendgrid/mail';
import { SendGridMailerService } from './sendgrid-mailer.service.js';

const sgSend = sgMail.send as jest.Mock;
const sgSetApiKey = sgMail.setApiKey as jest.Mock;

describe('SendGridMailerService', () => {
  let service: SendGridMailerService;

  beforeEach(() => {
    sgSend.mockReset();
    sgSetApiKey.mockReset();
    service = new SendGridMailerService();
  });

  it('configura la API key de SendGrid en el constructor', () => {
    expect(sgSetApiKey).toHaveBeenCalledWith('SG.test-key');
  });

  it('envía el email con el shape correcto del Dynamic Template', async () => {
    sgSend.mockResolvedValueOnce([{ statusCode: 202 }, {}]);

    await service.sendPasswordResetEmail({
      to: 'user@spendwise.test',
      firstName: 'Iván',
      lastName: 'Tellería',
      resetUrl: 'https://app.spendwise.test/auth/reset-password?token=abc',
    });

    expect(sgSend).toHaveBeenCalledTimes(1);
    expect(sgSend).toHaveBeenCalledWith({
      to: 'user@spendwise.test',
      from: { email: 'no-reply@spendwise.test', name: 'SpendWise Test' },
      templateId: 'd-template-id-123',
      dynamicTemplateData: {
        first_name: 'Iván',
        last_name: 'Tellería',
        link: 'https://app.spendwise.test/auth/reset-password?token=abc',
      },
    });
  });

  it('no propaga errores cuando SendGrid falla (anti-enumeration)', async () => {
    const loggerSpy = jest
      .spyOn(
        (service as unknown as { logger: { error: jest.Mock } }).logger,
        'error',
      )
      .mockImplementation(() => undefined);
    sgSend.mockRejectedValueOnce(new Error('SendGrid down'));

    await expect(
      service.sendPasswordResetEmail({
        to: 'user@spendwise.test',
        firstName: 'Iván',
        lastName: 'Tellería',
        resetUrl: 'https://app.spendwise.test/auth/reset-password?token=abc',
      }),
    ).resolves.toBeUndefined();

    expect(loggerSpy).toHaveBeenCalledTimes(1);
  });
});
