import {
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
  UseGuards,
} from '@nestjs/common';
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
    @CurrentUser() userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Put('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.usersService.changePassword(userId, dto);
  }

  @Put('preferences')
  async updatePreferences(
    @CurrentUser() userId: string,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updatePreferences(userId, dto);
  }

  @Put('profile-image')
  async updateProfileImage(
    @CurrentUser() userId: string,
    @Body('imageUrl') imageUrl: string,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfileImage(userId, imageUrl);
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findOneById(id);
    return UserResponseDto.fromEntity(user);
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
