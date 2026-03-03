import { UserRole } from '../../../common/enums/index.js';
import { UserPreferences } from '../interfaces/user-preferences.interface.js';
import { User } from '../entities/user.entity.js';

export class UserResponseDto {
  id!: string;
  name!: string;
  surname!: string;
  email!: string;
  role!: UserRole;
  profileImage!: string | null;
  preferences!: UserPreferences;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.surname = user.surname;
    dto.email = user.email;
    dto.role = user.role;
    dto.profileImage = user.profileImage;
    dto.preferences = user.preferences;
    dto.isActive = user.isActive;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
