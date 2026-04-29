jest.mock('uuid', () => ({
  v4: jest.fn(() => '11111111-2222-3333-4444-555555555555'),
}));

jest.mock('../../config/app/index.js', () => ({
  config: {
    google: { clientId: null },
    jwt: {
      secret: 'test-secret',
      access: { expiresIn: '15m' },
      refresh: { secret: 'test-refresh-secret', expiresIn: '7d' },
    },
    app: { frontend: { url: 'https://app.spendwise.test' } },
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { MailerPort } from '../mail/ports/mailer.port.js';
import { UserRole } from '../../common/enums/index.js';

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-uuid-1',
    name: 'Iván',
    surname: 'Tellería',
    email: 'ivan@spendwise.test',
    passwordHash: 'hashed-password',
    role: UserRole.user,
    profileImage: null,
    preferences: {},
    refreshTokenHash: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    googleId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as User;

describe('AuthService — forgotPassword', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findOneByEmail'>>;
  let usersRepository: { update: jest.Mock };
  let mailer: jest.Mocked<MailerPort>;

  beforeEach(async () => {
    usersService = {
      findOneByEmail: jest.fn(),
    };
    usersRepository = {
      update: jest.fn().mockResolvedValue(undefined),
    };
    mailer = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: MailerPort, useValue: mailer },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('envía el email y persiste el token cuando el usuario existe', async () => {
    const user = buildUser();
    usersService.findOneByEmail.mockResolvedValue(user);

    await service.forgotPassword({ email: user.email });

    expect(usersRepository.update).toHaveBeenCalledTimes(1);
    const [updatedId, payload] = usersRepository.update.mock.calls[0] as [
      string,
      { passwordResetToken: string; passwordResetExpires: Date },
    ];
    expect(updatedId).toBe(user.id);
    expect(payload.passwordResetToken).toBeDefined();
    expect(payload.passwordResetToken).not.toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}/i,
    );
    expect(payload.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());

    expect(mailer.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const mailerArg = mailer.sendPasswordResetEmail.mock.calls[0][0];
    expect(mailerArg.to).toBe(user.email);
    expect(mailerArg.firstName).toBe(user.name);
    expect(mailerArg.lastName).toBe(user.surname);
    expect(mailerArg.resetUrl).toMatch(
      /^https:\/\/app\.spendwise\.test\/auth\/reset-password\?token=[0-9a-f-]{36}$/i,
    );

    const rawToken = new URL(mailerArg.resetUrl).searchParams.get('token');
    expect(rawToken).toBeTruthy();
    const isHashOfRaw = await bcrypt.compare(
      rawToken!,
      payload.passwordResetToken,
    );
    expect(isHashOfRaw).toBe(true);
  });

  it('no envía email ni toca el repo cuando el usuario no existe', async () => {
    usersService.findOneByEmail.mockResolvedValue(null);

    await expect(
      service.forgotPassword({ email: 'desconocido@spendwise.test' }),
    ).resolves.toBeUndefined();

    expect(usersRepository.update).not.toHaveBeenCalled();
    expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
