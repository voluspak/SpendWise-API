import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service.js';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetResponseDto,
  BudgetStatusResponseDto,
} from './dto/index.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { JwtPayload } from '../auth/interfaces/index.js';

@Controller('budgets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
  ): Promise<BudgetResponseDto[]> {
    return this.budgetsService.findAll(user.sub);
  }

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.budgetsService.create(user.sub, dto);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.budgetsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.budgetsService.remove(user.sub, id);
  }

  @Get(':id/status')
  async getStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BudgetStatusResponseDto> {
    return this.budgetsService.getStatus(user.sub, id);
  }
}
