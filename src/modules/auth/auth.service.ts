import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { JwtPayload, TokenResponse } from './interfaces/index.js';
import {
  RegisterDto,
  LoginDto,
  GoogleAuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
} from './dto/index.js';
import {
  SALT_ROUNDS,
  PASSWORD_RESET_EXPIRATION_HOURS,
} from './constants/auth.constants.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client | null;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = googleClientId
      ? new OAuth2Client(googleClientId)
      : null;
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.createUser({
      name: dto.name,
      surname: dto.surname,
      email: dto.email,
      password: dto.password,
    });

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return AuthResponseDto.from(
      tokens.accessToken,
      tokens.refreshToken,
      UserResponseDto.fromEntity(user),
    );
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findOneByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return AuthResponseDto.from(
      tokens.accessToken,
      tokens.refreshToken,
      UserResponseDto.fromEntity(user),
    );
  }

  async googleAuth(dto: GoogleAuthDto): Promise<AuthResponseDto> {
    if (!this.googleClient) {
      throw new BadRequestException(
        'Autenticación con Google no está configurada',
      );
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.token,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    });

    const googlePayload = ticket.getPayload();
    if (!googlePayload || !googlePayload.email) {
      throw new UnauthorizedException('Token de Google inválido');
    }

    let user = await this.usersService.findOneByGoogleId(googlePayload.sub);

    if (!user) {
      user = await this.usersService.findOneByEmail(googlePayload.email);
      if (user) {
        user.googleId = googlePayload.sub;
        user = await this.usersRepository.save(user);
      } else {
        user = await this.usersService.createUser({
          name: googlePayload.given_name ?? googlePayload.email.split('@')[0],
          surname: googlePayload.family_name ?? '',
          email: googlePayload.email,
          googleId: googlePayload.sub,
        });
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return AuthResponseDto.from(
      tokens.accessToken,
      tokens.refreshToken,
      UserResponseDto.fromEntity(user),
    );
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthResponseDto> {
    const user = await this.usersService.findOneById(userId);

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const isTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!isTokenValid) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return AuthResponseDto.from(
      tokens.accessToken,
      tokens.refreshToken,
      UserResponseDto.fromEntity(user),
    );
  }

  async logout(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { refreshTokenHash: null });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findOneByEmail(dto.email);

    if (user) {
      const resetToken = uuidv4();
      const hashedToken = await bcrypt.hash(resetToken, SALT_ROUNDS);

      const expires = new Date();
      expires.setHours(expires.getHours() + PASSWORD_RESET_EXPIRATION_HOURS);

      await this.usersRepository.update(user.id, {
        passwordResetToken: hashedToken,
        passwordResetExpires: expires,
      });

      this.logger.log(
        `Password reset token for ${user.email}: ${resetToken}`,
      );
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const users = await this.usersRepository.find({
      where: {
        passwordResetExpires: MoreThan(new Date()),
      },
    });

    let matchedUser: User | null = null;
    for (const user of users) {
      if (!user.passwordResetToken) continue;
      const isMatch = await bcrypt.compare(
        dto.token,
        user.passwordResetToken,
      );
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.usersRepository.update(matchedUser.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshTokenHash: null,
    });
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOneById(userId);
    return UserResponseDto.fromEntity(user);
  }

  private async generateTokens(user: User): Promise<TokenResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRATION'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.usersRepository.update(userId, { refreshTokenHash: hash });
  }
}
