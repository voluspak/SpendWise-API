import { Request } from 'express';
import { ExtractJwt } from 'passport-jwt';
import { config } from '../../../config/app/index.js';

type CookiesRecord = Record<string, string>;

const { cookies } = config;

export function extractAccessTokenFromCookie(req: Request): string | null {
  const reqCookies = req.cookies as CookiesRecord | undefined;
  return reqCookies?.[cookies.accessToken.name] ?? null;
}

export function extractRefreshTokenFromCookie(req: Request): string | null {
  const reqCookies = req.cookies as CookiesRecord | undefined;
  return reqCookies?.[cookies.refreshToken.name] ?? null;
}

export function extractAccessTokenWithFallback(req: Request): string | null {
  return (
    extractAccessTokenFromCookie(req) ??
    ExtractJwt.fromAuthHeaderAsBearerToken()(req)
  );
}
