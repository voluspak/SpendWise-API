import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './entities/budget.entity.js';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetResponseDto,
  BudgetStatusResponseDto,
} from './dto/index.js';
import { CategoriesService } from '../categories/categories.service.js';
import { TransactionsService } from '../transactions/transactions.service.js';
import { BudgetPeriod } from '../../common/enums/index.js';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>,
    private readonly categoriesService: CategoriesService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async findAll(userId: string): Promise<BudgetResponseDto[]> {
    const budgets = await this.budgetsRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    return budgets.map((b) => BudgetResponseDto.fromEntity(b));
  }

  async create(
    userId: string,
    dto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    await this.validateCategoryForUser(dto.categoryId, userId);

    const existing = await this.budgetsRepository.findOneBy({
      userId,
      categoryId: dto.categoryId,
      period: dto.period,
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe un presupuesto para esta categoría y período',
      );
    }

    const budget = this.budgetsRepository.create({ ...dto, userId });
    const saved = await this.budgetsRepository.save(budget);
    return BudgetResponseDto.fromEntity(saved);
  }

  async update(
    userId: string,
    budgetId: string,
    dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const budget = await this.findOwnedBudget(userId, budgetId);

    if (dto.categoryId) {
      await this.validateCategoryForUser(dto.categoryId, userId);
    }

    const newCategoryId = dto.categoryId ?? budget.categoryId;
    const newPeriod = dto.period ?? budget.period;

    if (dto.categoryId || dto.period) {
      const existing = await this.budgetsRepository.findOneBy({
        userId,
        categoryId: newCategoryId,
        period: newPeriod,
      });
      if (existing && existing.id !== budgetId) {
        throw new ConflictException(
          'Ya existe un presupuesto para esta categoría y período',
        );
      }
    }

    Object.assign(budget, dto);
    const saved = await this.budgetsRepository.save(budget);
    return BudgetResponseDto.fromEntity(saved);
  }

  async remove(userId: string, budgetId: string): Promise<void> {
    const budget = await this.findOwnedBudget(userId, budgetId);
    await this.budgetsRepository.remove(budget);
  }

  async getStatus(
    userId: string,
    budgetId: string,
  ): Promise<BudgetStatusResponseDto> {
    const budget = await this.findOwnedBudget(userId, budgetId);
    const { startDate, endDate } = this.getPeriodRange(budget.period);

    const currentSpent = await this.transactionsService.sumExpensesByCategory(
      userId,
      budget.categoryId,
      startDate,
      endDate,
    );

    const amountLimit = Number(budget.amountLimit);
    const remaining = Math.max(amountLimit - currentSpent, 0);
    const usagePercentage =
      amountLimit > 0
        ? Math.round((currentSpent / amountLimit) * 10000) / 100
        : 0;

    const status = new BudgetStatusResponseDto();
    status.budgetId = budget.id;
    status.categoryId = budget.categoryId;
    status.period = budget.period;
    status.amountLimit = amountLimit;
    status.currentSpent = currentSpent;
    status.remaining = remaining;
    status.usagePercentage = usagePercentage;
    status.alertThreshold = budget.alertThreshold;
    status.isOverThreshold = usagePercentage >= budget.alertThreshold;
    status.isOverBudget = currentSpent > amountLimit;
    status.periodStart = startDate;
    status.periodEnd = endDate;
    return status;
  }

  private async findOwnedBudget(
    userId: string,
    budgetId: string,
  ): Promise<Budget> {
    const budget = await this.budgetsRepository.findOneBy({ id: budgetId });
    if (!budget) {
      throw new NotFoundException(
        `Presupuesto con id ${budgetId} no encontrado`,
      );
    }
    if (budget.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este presupuesto',
      );
    }
    return budget;
  }

  private getPeriodRange(period: BudgetPeriod): {
    startDate: string;
    endDate: string;
  } {
    const now = new Date();

    switch (period) {
      case BudgetPeriod.WEEKLY: {
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return {
          startDate: this.formatDate(monday),
          endDate: this.formatDate(sunday),
        };
      }
      case BudgetPeriod.MONTHLY: {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: this.formatDate(firstDay),
          endDate: this.formatDate(lastDay),
        };
      }
      case BudgetPeriod.YEARLY: {
        const firstDay = new Date(now.getFullYear(), 0, 1);
        const lastDay = new Date(now.getFullYear(), 11, 31);
        return {
          startDate: this.formatDate(firstDay),
          endDate: this.formatDate(lastDay),
        };
      }
    }
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private async validateCategoryForUser(
    categoryId: string,
    userId: string,
  ): Promise<void> {
    const category = await this.categoriesService.findOneById(categoryId);
    if (!category.isGlobal && category.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para usar esta categoría',
      );
    }
  }
}
