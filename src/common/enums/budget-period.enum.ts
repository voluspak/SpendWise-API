export const BudgetPeriod = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;

export type BudgetPeriod = (typeof BudgetPeriod)[keyof typeof BudgetPeriod];
