import { Category } from '../entities/category.entity.js';

export class CategoryResponseDto {
  id!: string;
  name!: string;
  icon!: string;
  color!: string;
  isGlobal!: boolean;
  userId!: string | null;
  createdAt!: Date;

  static fromEntity(category: Category): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.icon = category.icon;
    dto.color = category.color;
    dto.isGlobal = category.isGlobal;
    dto.userId = category.userId;
    dto.createdAt = category.createdAt;
    return dto;
  }
}
