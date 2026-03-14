import { BudgetPeriod } from '../../../common/enums/index.js';

export class BudgetStatusResponseDto {
  budgetId!: string;
  categoryId!: string;
  period!: BudgetPeriod;
  amountLimit!: number;
  currentSpent!: number;
  remaining!: number;
  usagePercentage!: number;
  alertThreshold!: number;
  isOverThreshold!: boolean;
  isOverBudget!: boolean;
  periodStart!: string;
  periodEnd!: string;
}
