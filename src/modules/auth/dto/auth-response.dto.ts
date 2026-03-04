import { UserResponseDto } from '../../users/dto/user-response.dto.js';

export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: UserResponseDto;

  static from(
    accessToken: string,
    refreshToken: string,
    user: UserResponseDto,
  ): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = accessToken;
    dto.refreshToken = refreshToken;
    dto.user = user;
    return dto;
  }
}
