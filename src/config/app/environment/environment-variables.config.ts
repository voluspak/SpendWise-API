import { type CookieOptions } from 'express';
import { type StringValue } from 'ms';

type CookieOptionsWithName = CookieOptions & { name: string };

export const environmentVariablesConfig = {
  bcrypt: {
    salt: 10,
  },
  jwt: {
    secret: null as unknown as string,
    access: {
      expiresIn: '15m' as StringValue,
    },
    refresh: {
      secret: null as unknown as string,
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
      name: null as unknown as string,
      host: null as unknown as string,
      password: null as unknown as string,
      port: null as unknown as number,
      username: null as unknown as string,
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
