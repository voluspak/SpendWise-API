import { BudgetPeriod } from '../../../common/enums/index.js';
import { Budget } from '../entities/budget.entity.js';

export class BudgetResponseDto {
  id!: string;
  amountLimit!: number;
  period!: BudgetPeriod;
  categoryId!: string;
  userId!: string;
  alertThreshold!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(budget: Budget): BudgetResponseDto {
    const dto = new BudgetResponseDto();
    dto.id = budget.id;
    dto.amountLimit = Number(budget.amountLimit);
    dto.period = budget.period;
    dto.categoryId = budget.categoryId;
    dto.userId = budget.userId;
    dto.alertThreshold = budget.alertThreshold;
    dto.createdAt = budget.createdAt;
    dto.updatedAt = budget.updatedAt;
    return dto;
  }
}
