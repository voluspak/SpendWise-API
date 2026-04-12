import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/index.js';
import { extractRefreshTokenFromCookie } from '../extractors/cookie-jwt.extractor.js';
import { config } from '../../../config/app/index.js';

type CookiesRecord = Record<string, string>;

export class JwtRefreshPayload extends JwtPayload {
  refreshToken!: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: extractRefreshTokenFromCookie,
      ignoreExpiration: false,
      secretOrKey: config.jwt.refresh.secret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): JwtRefreshPayload {
    const reqCookies = req.cookies as CookiesRecord | undefined;
    const refreshToken =
      reqCookies?.[config.cookies.refreshToken.name] ?? '';
    return { ...payload, refreshToken };
  }
}
