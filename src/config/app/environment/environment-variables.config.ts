import { type CookieOptions } from 'express';
import { type StringValue } from 'ms';
import { REQUIRED } from '../config-factory.service.js';

type CookieOptionsWithName = CookieOptions & { name: string };

export const environmentVariablesConfig = {
  bcrypt: {
    salt: 10,
  },
  jwt: {
    secret: REQUIRED as unknown as string,
    access: {
      expiresIn: '15m' as StringValue,
    },
    refresh: {
      secret: REQUIRED as unknown as string,
      expiresIn: '7d' as StringValue,
    },
  },
  cookies: {
    accessToken: {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      name: 'accessToken-sw',
    },
    refreshToken: {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      name: 'refreshToken-sw',
    },
    clearToken: {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
    },
  } as {
    accessToken: CookieOptionsWithName;
    refreshToken: CookieOptionsWithName;
    clearToken: CookieOptions;
  },
  postgres: {
    database: {
      name: REQUIRED as unknown as string,
      host: REQUIRED as unknown as string,
      password: REQUIRED as unknown as string,
      port: REQUIRED as unknown as number,
      username: REQUIRED as unknown as string,
    },
  },
  google: {
    clientId: null as string | null,
  },
  logger: {
    level: 'warn',
  },
  typeorm: {
    logging: false,
  },
};
