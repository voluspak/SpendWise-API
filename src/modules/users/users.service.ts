import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import {
  ChangePasswordDto,
  ListUsersQueryDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
  UpdateUserStatusDto,
  UserResponseDto,
  UserStatusFilter,
} from './dto/index.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { UserRole } from '../../common/enums/index.js';
import { DEFAULT_USER_PREFERENCES } from './constants/user.constants.js';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(
    query: ListUsersQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.usersRepository.createQueryBuilder('user');

    if (query.status === UserStatusFilter.Active) {
      qb.andWhere('user.isActive = :isActive', { isActive: true });
    } else if (query.status === UserStatusFilter.Inactive) {
      qb.andWhere('user.isActive = :isActive', { isActive: false });
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await qb.getManyAndCount();
    const data = users.map((user) => UserResponseDto.fromEntity(user));

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async findOneByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ googleId });
  }

  async createUser(data: {
    name: string;
    surname: string;
    email: string;
    password?: string;
    role?: UserRole;
    googleId?: string;
  }): Promise<User> {
    const existing = await this.findOneByEmail(data.email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = data.password
      ? await bcrypt.hash(data.password, SALT_ROUNDS)
      : null;

    const user = this.usersRepository.create({
      name: data.name,
      surname: data.surname,
      email: data.email,
      passwordHash,
      role: data.role ?? UserRole.user,
      googleId: data.googleId ?? null,
      preferences: DEFAULT_USER_PREFERENCES,
    });

    return this.usersRepository.save(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.findOneById(userId);

    if (dto.email !== undefined && dto.email !== user.email) {
      const existing = await this.findOneByEmail(dto.email);
      if (existing) {
        throw new ConflictException('El email ya está en uso');
      }
      user.email = dto.email;
    }
    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    if (dto.surname !== undefined) {
      user.surname = dto.surname;
    }

    const saved = await this.usersRepository.save(user);
    return UserResponseDto.fromEntity(saved);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findOneById(userId);

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Esta cuenta no tiene contraseña configurada',
      );
    }

    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.usersRepository.save(user);
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<UserResponseDto> {
    const user = await this.findOneById(userId);

    user.preferences = {
      ...user.preferences,
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.language !== undefined && { language: dto.language }),
      ...(dto.dateFormat !== undefined && { dateFormat: dto.dateFormat }),
    };
    const saved = await this.usersRepository.save(user);
    return UserResponseDto.fromEntity(saved);
  }

  async updateProfileImage(
    userId: string,
    imageUrl: string,
  ): Promise<UserResponseDto> {
    const user = await this.findOneById(userId);
    user.profileImage = imageUrl;
    const saved = await this.usersRepository.save(user);
    return UserResponseDto.fromEntity(saved);
  }

  async updateStatus(
    userId: string,
    dto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    const user = await this.findOneById(userId);
    user.isActive = dto.isActive;
    const saved = await this.usersRepository.save(user);
    return UserResponseDto.fromEntity(saved);
  }

  async softDelete(userId: string): Promise<void> {
    const user = await this.findOneById(userId);
    await this.usersRepository.softRemove(user);
  }
}
