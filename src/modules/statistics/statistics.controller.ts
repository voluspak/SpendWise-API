import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service.js';
import {
  ByCategoryQueryDto,
  MonthlyQueryDto,
  TopCategoriesQueryDto,
  AdminOverviewQueryDto,
  BalanceResponseDto,
  CategoryStatResponseDto,
  MonthlyStatResponseDto,
  NetWorthResponseDto,
  TopCategoryResponseDto,
  AdminOverviewResponseDto,
  UserGrowthResponseDto,
} from './dto/index.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/enums/index.js';
import { JwtPayload } from '../auth/interfaces/index.js';

@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('balance')
  async getBalance(
    @CurrentUser() user: JwtPayload,
  ): Promise<BalanceResponseDto> {
    return this.statisticsService.getBalance(user.sub);
  }

  @Get('by-category')
  async getByCategory(
    @CurrentUser() user: JwtPayload,
    @Query() query: ByCategoryQueryDto,
  ): Promise<CategoryStatResponseDto[]> {
    return this.statisticsService.getByCategory(user.sub, query);
  }

  @Get('monthly')
  async getMonthly(
    @CurrentUser() user: JwtPayload,
    @Query() query: MonthlyQueryDto,
  ): Promise<MonthlyStatResponseDto[]> {
    return this.statisticsService.getMonthly(user.sub, query);
  }

  @Get('net-worth')
  async getNetWorth(
    @CurrentUser() user: JwtPayload,
    @Query() query: MonthlyQueryDto,
  ): Promise<NetWorthResponseDto[]> {
    return this.statisticsService.getNetWorth(user.sub, query);
  }

  @Get('top-categories')
  async getTopCategories(
    @CurrentUser() user: JwtPayload,
    @Query() query: TopCategoriesQueryDto,
  ): Promise<TopCategoryResponseDto[]> {
    return this.statisticsService.getTopCategories(user.sub, query);
  }

  @Get('admin/overview')
  @Roles(UserRole.admin)
  async getAdminOverview(
    @Query() query: AdminOverviewQueryDto,
  ): Promise<AdminOverviewResponseDto> {
    return this.statisticsService.getAdminOverview(query);
  }

  @Get('admin/user-growth')
  @Roles(UserRole.admin)
  async getUserGrowth(
    @Query() query: MonthlyQueryDto,
  ): Promise<UserGrowthResponseDto[]> {
    return this.statisticsService.getUserGrowth(query);
  }
}
