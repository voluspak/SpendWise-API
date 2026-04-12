import { UserResponseDto } from '../../users/dto/user-response.dto.js';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}
