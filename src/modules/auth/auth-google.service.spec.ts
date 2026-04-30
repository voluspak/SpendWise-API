/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '11111111-2222-3333-4444-555555555555'),
}));

import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { LoginTicket, OAuth2Client, TokenPayload } from 'google-auth-library';
import type { Repository } from 'typeorm';
import { AuthService } from './auth.service.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { MailerPort } from '../mail/ports/mailer.port.js';

jest.mock('../../config/app/index.js', () => ({
  config: {
    google: { clientId: 'test-google-client-id' },
    jwt: {
      secret: 'test-secret',
      access: { expiresIn: '15m' },
      refresh: { secret: 'test-refresh-secret', expiresIn: '7d' },
    },
    app: { frontend: { url: 'https://app.spendwise.test' } },
  },
}));

jest.mock('google-auth-library');

type MockedUsersService = jest.Mocked<
  Pick<
    UsersService,
    'findOneByGoogleId' | 'findOneByEmail' | 'findOneById' | 'createUser'
  >
>;

type MockedUserRepository = {
  save: jest.MockedFunction<Repository<User>['save']>;
  update: jest.MockedFunction<Repository<User>['update']>;
};

type MockedJwtService = jest.Mocked<Pick<JwtService, 'signAsync'>>;

type AuthInternals = { googleClient: OAuth2Client | null };

const exposeInternals = (svc: AuthService): AuthInternals =>
  svc as unknown as AuthInternals;

const buildLoginTicket = (payload: TokenPayload | null): LoginTicket =>
  ({ getPayload: () => payload }) as unknown as LoginTicket;

describe('AuthService — googleAuth', () => {
  let service: AuthService;
  let usersService: MockedUsersService;
  let usersRepository: MockedUserRepository;
  let jwtService: MockedJwtService;
  let googleClient: OAuth2Client;

  const mockGooglePayload: TokenPayload = {
    iss: 'accounts.google.com',
    aud: 'test-google-client-id',
    sub: 'google-id-123',
    iat: 0,
    exp: 0,
    email: 'google@user.test',
    given_name: 'Google',
    family_name: 'User',
  };

  beforeEach(async () => {
    usersService = {
      findOneByGoogleId: jest.fn(),
      findOneByEmail: jest.fn(),
      findOneById: jest.fn(),
      createUser: jest.fn(),
    };

    usersRepository = {
      save: jest.fn() as MockedUserRepository['save'],
      update: jest.fn() as MockedUserRepository['update'],
    };
    usersRepository.update.mockResolvedValue({
      affected: 1,
      raw: [],
      generatedMaps: [],
    });

    jwtService = {
      signAsync: jest.fn(),
    };
    jwtService.signAsync.mockResolvedValue('test-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: MailerPort, useValue: {} },
      ],
    }).compile();

    service = module.get(AuthService);

    const MockedOAuth2Client = OAuth2Client as jest.MockedClass<
      typeof OAuth2Client
    >;
    MockedOAuth2Client.mockImplementation(
      () =>
        ({
          verifyIdToken: jest
            .fn()
            .mockResolvedValue(buildLoginTicket(mockGooglePayload)),
        }) as unknown as OAuth2Client,
    );

    googleClient = new OAuth2Client();
    exposeInternals(service).googleClient = googleClient;
  });

  it('debe crear un usuario nuevo si no existe ni por googleId ni por email', async () => {
    usersService.findOneByGoogleId.mockResolvedValue(null);
    usersService.findOneByEmail.mockResolvedValue(null);
    const newUser = {
      id: 'new-id',
      email: mockGooglePayload.email,
      isActive: true,
      name: mockGooglePayload.given_name,
      surname: mockGooglePayload.family_name,
    } as User;
    usersService.createUser.mockResolvedValue(newUser);

    const result = await service.googleAuth({ token: 'fake-token' });

    expect(usersService.createUser).toHaveBeenCalledWith({
      name: mockGooglePayload.given_name,
      surname: mockGooglePayload.family_name,
      email: mockGooglePayload.email,
      googleId: mockGooglePayload.sub,
    });
    expect(result.user.email).toBe(mockGooglePayload.email);
  });

  it('debe vincular googleId si el usuario existe por email pero no tiene googleId', async () => {
    const existingUser = {
      id: 'existing-id',
      email: mockGooglePayload.email,
      googleId: null,
      isActive: true,
    } as User;
    usersService.findOneByGoogleId.mockResolvedValue(null);
    usersService.findOneByEmail.mockResolvedValue(existingUser);
    usersRepository.save.mockResolvedValue({
      ...existingUser,
      googleId: mockGooglePayload.sub,
    });

    await service.googleAuth({ token: 'fake-token' });

    expect(usersRepository.save).toHaveBeenCalled();
    const [savedUser] = usersRepository.save.mock.calls[0] as [User];
    expect(savedUser.googleId).toBe(mockGooglePayload.sub);
  });

  it('debe fallar si el token de Google es inválido', async () => {
    googleClient.verifyIdToken = jest
      .fn()
      .mockResolvedValue(buildLoginTicket(null));

    await expect(
      service.googleAuth({ token: 'invalid-token' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debe fallar si el usuario está desactivado', async () => {
    const inactiveUser = {
      id: 'inactive-id',
      isActive: false,
    } as User;
    usersService.findOneByGoogleId.mockResolvedValue(inactiveUser);

    await expect(service.googleAuth({ token: 'fake-token' })).rejects.toThrow(
      new UnauthorizedException('Usuario desactivado'),
    );
  });
});
