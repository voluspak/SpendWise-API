import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  RegisterDto,
  LoginDto,
  GoogleAuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
} from './dto/index.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtPayload } from './interfaces/index.js';
import { JwtRefreshPayload } from './strategies/jwt-refresh.strategy.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { config } from '../../config/app/index.js';

const { cookies } = config;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return AuthResponseDto.from(result.user);
  }

  @Post('login')
  @Throttle({
    short: { ttl: 1000, limit: 1 },
    medium: { ttl: 60000, limit: 5 },
  })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const result = await this.authService.login(dto);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { message: 'Inicio de sesión exitoso' };
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(
    @Body() dto: GoogleAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const result = await this.authService.googleAuth(dto);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { message: 'Autenticación con Google exitosa' };
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @CurrentUser() user: JwtRefreshPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const result = await this.authService.refreshTokens(
      user.sub,
      user.refreshToken,
    );
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { message: 'Token renovado exitosamente' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(user.sub);
    res.clearCookie(cookies.accessToken.name, cookies.clearToken);
    res.clearCookie(cookies.refreshToken.name, cookies.clearToken);
  }

  @Post('forgot-password')
  @Throttle({
    short: { ttl: 1000, limit: 1 },
    medium: { ttl: 60000, limit: 3 },
  })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto);
    return {
      message:
        'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
    };
  }

  @Post('reset-password')
  @Throttle({
    short: { ttl: 1000, limit: 1 },
    medium: { ttl: 60000, limit: 3 },
  })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(dto);
    return { message: 'Contraseña actualizada correctamente' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.authService.getProfile(user.sub);
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie(cookies.accessToken.name, accessToken, cookies.accessToken);
    res.cookie(cookies.refreshToken.name, refreshToken, cookies.refreshToken);
  }
}
