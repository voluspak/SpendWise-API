import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service.js';
import { JwtPayload } from '../interfaces/index.js';
import { extractAccessTokenWithFallback } from '../extractors/cookie-jwt.extractor.js';
import { config } from '../../../config/app/index.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly usersService: UsersService;

  constructor(usersService: UsersService) {
    super({
      jwtFromRequest: extractAccessTokenWithFallback,
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
    this.usersService = usersService;
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.usersService.findOneById(payload.sub);
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }
    return payload;
  }
}
