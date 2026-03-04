import { IsString, MinLength, MaxLength } from 'class-validator';
import { MIN_PASSWORD_LENGTH } from '../constants/auth.constants.js';

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  @MaxLength(128)
  newPassword!: string;
}
