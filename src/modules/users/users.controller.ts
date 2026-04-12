import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from './users.service.js';
import {
  ChangePasswordDto,
  ListUsersQueryDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
  UpdateUserStatusDto,
  UserResponseDto,
} from './dto/index.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/enums/index.js';
import { JwtPayload } from '../auth/interfaces/index.js';

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.Admin)
  async findAll(
    @Query() query: ListUsersQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.usersService.findAll(query);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Put('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.usersService.changePassword(user.sub, dto);
  }

  @Put('preferences')
  async updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updatePreferences(user.sub, dto);
  }

  @Put('profile-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/profile-images',
        filename: (_req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
          cb(new BadRequestException('Solo se permiten imágenes JPEG, PNG o WebP'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async updateProfileImage(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    if (!file) {
      throw new BadRequestException('Se requiere una imagen');
    }
    const imageUrl = `/uploads/profile-images/${file.filename}`;
    return this.usersService.updateProfileImage(user.sub, imageUrl);
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const userEntity = await this.usersService.findOneById(id);
    return UserResponseDto.fromEntity(userEntity);
  }

  @Patch(':id/status')
  @Roles(UserRole.Admin)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.usersService.softDelete(id);
  }
}
