import { UserResponseDto } from '../../users/dto/user-response.dto.js';

export class AuthResponseDto {
  user!: UserResponseDto;

  static from(user: UserResponseDto): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.user = user;
    return dto;
  }
}
