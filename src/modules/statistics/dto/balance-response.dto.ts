export class MonthStatsDto {
  income!: number;
  expenses!: number;
  variationIncomePercent!: number | null;
  variationExpensesPercent!: number | null;
}

export class BalanceResponseDto {
  totalIncome!: number;
  totalExpenses!: number;
  balance!: number;
  currentMonth!: MonthStatsDto;
}
