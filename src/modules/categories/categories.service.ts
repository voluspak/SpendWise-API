import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CategoryResponseDto } from './dto/category-response.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async findAllForUser(userId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesRepository.find({
      where: [{ isGlobal: true }, { userId }],
      order: { createdAt: 'ASC' },
    });
    return categories.map((c) => CategoryResponseDto.fromEntity(c));
  }

  async findAllAdmin(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesRepository.find({
      order: { createdAt: 'ASC' },
    });
    return categories.map((c) => CategoryResponseDto.fromEntity(c));
  }

  async create(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = this.categoriesRepository.create({
      ...dto,
      isGlobal: false,
      userId,
    });
    const saved = await this.categoriesRepository.save(category);
    return CategoryResponseDto.fromEntity(saved);
  }

  async createGlobal(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = this.categoriesRepository.create({
      ...dto,
      isGlobal: true,
      userId: null,
    });
    const saved = await this.categoriesRepository.save(category);
    return CategoryResponseDto.fromEntity(saved);
  }

  async update(
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.findOneById(categoryId);

    if (category.isGlobal) {
      throw new ForbiddenException('No se pueden modificar categorías globales');
    }
    if (category.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar esta categoría',
      );
    }

    Object.assign(category, dto);
    const saved = await this.categoriesRepository.save(category);
    return CategoryResponseDto.fromEntity(saved);
  }

  async updateGlobal(
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.findOneById(categoryId);

    if (!category.isGlobal) {
      throw new ForbiddenException(
        'Esta ruta solo permite modificar categorías globales',
      );
    }

    Object.assign(category, dto);
    const saved = await this.categoriesRepository.save(category);
    return CategoryResponseDto.fromEntity(saved);
  }

  async remove(userId: string, categoryId: string): Promise<void> {
    const category = await this.findOneById(categoryId);

    if (category.isGlobal) {
      throw new ForbiddenException('No se pueden eliminar categorías globales');
    }
    if (category.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta categoría',
      );
    }

    await this.categoriesRepository.remove(category);
  }

  async removeGlobal(categoryId: string): Promise<void> {
    const category = await this.findOneById(categoryId);

    if (!category.isGlobal) {
      throw new ForbiddenException(
        'Esta ruta solo permite eliminar categorías globales',
      );
    }

    await this.categoriesRepository.remove(category);
  }

  async findOneById(categoryId: string): Promise<Category> {
    const category = await this.categoriesRepository.findOneBy({
      id: categoryId,
    });
    if (!category) {
      throw new NotFoundException(
        `Categoría con id ${categoryId} no encontrada`,
      );
    }
    return category;
  }
}
