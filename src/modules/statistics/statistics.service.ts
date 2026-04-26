import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { User } from '../users/entities/user.entity.js';
import { TransactionType } from '../../common/enums/index.js';
import {
  ByCategoryQueryDto,
  MonthlyQueryDto,
  TopCategoriesQueryDto,
  AdminOverviewQueryDto,
  StatsPeriod,
  BalanceResponseDto,
  CategoryStatResponseDto,
  MonthlyStatResponseDto,
  NetWorthResponseDto,
  TopCategoryResponseDto,
  AdminOverviewResponseDto,
  UserGrowthResponseDto,
} from './dto/index.js';

const logger = new Logger('StatisticsService');

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getBalance(userId: string): Promise<BalanceResponseDto> {
    const totals = await this.transactionRepo
      .createQueryBuilder('t')
      .select(
        `COALESCE(SUM(CASE WHEN t.type = :income THEN t.amount ELSE 0 END), 0)`,
        'totalIncome',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN t.type = :expense THEN t.amount ELSE 0 END), 0)`,
        'totalExpenses',
      )
      .where('t.user_id = :userId', { userId })
      .setParameters({
        income: TransactionType.INCOME,
        expense: TransactionType.EXPENSE,
      })
      .getRawOne<{ totalIncome: string; totalExpenses: string }>();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [currentMonthStats, previousMonthStats] = await Promise.all([
      this.getMonthTotals(userId, currentYear, currentMonth),
      this.getMonthTotals(userId, previousYear, previousMonth),
    ]);

    const totalIncome = Number(totals?.totalIncome ?? 0);
    const totalExpenses = Number(totals?.totalExpenses ?? 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      currentMonth: {
        income: currentMonthStats.income,
        expenses: currentMonthStats.expenses,
        variationIncomePercent:
          previousMonthStats.income === 0
            ? null
            : ((currentMonthStats.income - previousMonthStats.income) /
                previousMonthStats.income) *
              100,
        variationExpensesPercent:
          previousMonthStats.expenses === 0
            ? null
            : ((currentMonthStats.expenses - previousMonthStats.expenses) /
                previousMonthStats.expenses) *
              100,
      },
    };
  }

  async getByCategory(
    userId: string,
    query: ByCategoryQueryDto,
  ): Promise<CategoryStatResponseDto[]> {
    const type = query?.type ?? TransactionType.EXPENSE;

    logger.log(`Searching by category with user ID: ${userId}`);

    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .innerJoin('t.category', 'c')
      .select('c.id', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect('c.color', 'categoryColor')
      .addSelect('c.icon', 'categoryIcon')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type });

    if (query.startDate) {
      qb.andWhere('t.date >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('t.date <= :endDate', { endDate: query.endDate });
    }

    qb.groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.color')
      .addGroupBy('c.icon')
      .orderBy('total', 'DESC');

    const rows = await qb.getRawMany<{
      categoryId: string;
      categoryName: string;
      categoryColor: string;
      categoryIcon: string;
      total: string;
    }>();

    return rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryColor: r.categoryColor,
      categoryIcon: r.categoryIcon,
      total: Number(r.total),
    }));
  }

  async getMonthly(
    userId: string,
    query: MonthlyQueryDto,
  ): Promise<MonthlyStatResponseDto[]> {
    const year = query.year ?? new Date().getFullYear();

    const rows = await this.transactionRepo
      .createQueryBuilder('t')
      .select('EXTRACT(MONTH FROM t.date)::int', 'month')
      .addSelect(
        `COALESCE(SUM(CASE WHEN t.type = :income THEN t.amount ELSE 0 END), 0)`,
        'income',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN t.type = :expense THEN t.amount ELSE 0 END), 0)`,
        'expense',
      )
      .where('t.user_id = :userId', { userId })
      .andWhere('EXTRACT(YEAR FROM t.date)::int = :year', { year })
      .setParameters({
        income: TransactionType.INCOME,
        expense: TransactionType.EXPENSE,
      })
      .groupBy('EXTRACT(MONTH FROM t.date)')
      .getRawMany<{ month: number; income: string; expense: string }>();

    const dataMap = new Map(rows.map((r) => [Number(r.month), r]));

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const row = dataMap.get(month);
      return {
        month,
        income: Number(row?.income ?? 0),
        expense: Number(row?.expense ?? 0),
      };
    });
  }

  async getNetWorth(
    userId: string,
    query: MonthlyQueryDto,
  ): Promise<NetWorthResponseDto[]> {
    const year = query.year ?? new Date().getFullYear();

    const carryOver = await this.transactionRepo
      .createQueryBuilder('t')
      .select(
        `COALESCE(SUM(CASE WHEN t.type = :income THEN t.amount ELSE -t.amount END), 0)`,
        'balance',
      )
      .where('t.user_id = :userId', { userId })
      .andWhere('EXTRACT(YEAR FROM t.date)::int < :year', { year })
      .setParameters({
        income: TransactionType.INCOME,
        expense: TransactionType.EXPENSE,
      })
      .getRawOne<{ balance: string }>();

    const monthlyData = await this.getMonthly(userId, { year });

    let accumulated = Number(carryOver?.balance ?? 0);

    return monthlyData.map((m) => {
      accumulated += m.income - m.expense;
      return { month: m.month, netWorth: accumulated };
    });
  }

  async getTopCategories(
    userId: string,
    query: TopCategoriesQueryDto,
  ): Promise<TopCategoryResponseDto[]> {
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();

    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .innerJoin('t.category', 'c')
      .select('c.id', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect('c.color', 'categoryColor')
      .addSelect('c.icon', 'categoryIcon')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: TransactionType.EXPENSE })
      .andWhere('EXTRACT(MONTH FROM t.date)::int = :month', { month })
      .andWhere('EXTRACT(YEAR FROM t.date)::int = :year', { year })
      .groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.color')
      .addGroupBy('c.icon')
      .orderBy('total', 'DESC')
      .limit(5);

    const rows = await qb.getRawMany<{
      categoryId: string;
      categoryName: string;
      categoryColor: string;
      categoryIcon: string;
      total: string;
    }>();

    const totalExpenses = await this.transactionRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: TransactionType.EXPENSE })
      .andWhere('EXTRACT(MONTH FROM t.date)::int = :month', { month })
      .andWhere('EXTRACT(YEAR FROM t.date)::int = :year', { year })
      .getRawOne<{ total: string }>();

    const grandTotal = Number(totalExpenses?.total ?? 0);

    return rows.map((r) => {
      const total = Number(r.total);
      return {
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        categoryColor: r.categoryColor,
        categoryIcon: r.categoryIcon,
        total,
        percentage: grandTotal === 0 ? 0 : (total / grandTotal) * 100,
      };
    });
  }

  async getAdminOverview(
    query: AdminOverviewQueryDto,
  ): Promise<AdminOverviewResponseDto> {
    const period = query.period ?? StatsPeriod.All;

    const usersQb = this.userRepo
      .createQueryBuilder('u')
      .select('COUNT(*)::int', 'totalUsers')
      .where('u.deleted_at IS NULL');

    const activeQb = this.userRepo
      .createQueryBuilder('u')
      .select('COUNT(*)::int', 'activeUsers')
      .where('u.deleted_at IS NULL')
      .andWhere("u.updated_at >= NOW() - INTERVAL '30 days'");

    const txQb = this.transactionRepo
      .createQueryBuilder('t')
      .select('COUNT(*)::int', 'totalTransactions')
      .addSelect('COALESCE(AVG(t.amount), 0)', 'averageTransactionValue');

    if (period !== StatsPeriod.All) {
      const interval = period === StatsPeriod.Month ? '1 month' : '1 year';
      const dateFilter = `t.created_at >= NOW() - INTERVAL '${interval}'`;
      txQb.where(dateFilter);
    }

    const [usersResult, activeResult, txResult] = await Promise.all([
      usersQb.getRawOne<{ totalUsers: number }>(),
      activeQb.getRawOne<{ activeUsers: number }>(),
      txQb.getRawOne<{
        totalTransactions: number;
        averageTransactionValue: string;
      }>(),
    ]);

    return {
      totalUsers: usersResult?.totalUsers ?? 0,
      activeUsers: activeResult?.activeUsers ?? 0,
      totalTransactions: txResult?.totalTransactions ?? 0,
      averageTransactionValue: Number(txResult?.averageTransactionValue ?? 0),
    };
  }

  async getUserGrowth(
    query: MonthlyQueryDto,
  ): Promise<UserGrowthResponseDto[]> {
    const year = query.year ?? new Date().getFullYear();

    const rows = await this.userRepo
      .createQueryBuilder('u')
      .select('EXTRACT(MONTH FROM u.created_at)::int', 'month')
      .addSelect('COUNT(*)::int', 'newUsers')
      .where('EXTRACT(YEAR FROM u.created_at)::int = :year', { year })
      .andWhere('u.deleted_at IS NULL')
      .groupBy('EXTRACT(MONTH FROM u.created_at)')
      .getRawMany<{ month: number; newUsers: number }>();

    const dataMap = new Map(rows.map((r) => [Number(r.month), r]));

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const row = dataMap.get(month);
      return {
        month,
        newUsers: Number(row?.newUsers ?? 0),
      };
    });
  }

  private async getMonthTotals(
    userId: string,
    year: number,
    month: number,
  ): Promise<{ income: number; expenses: number }> {
    const result = await this.transactionRepo
      .createQueryBuilder('t')
      .select(
        `COALESCE(SUM(CASE WHEN t.type = :income THEN t.amount ELSE 0 END), 0)`,
        'income',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN t.type = :expense THEN t.amount ELSE 0 END), 0)`,
        'expenses',
      )
      .where('t.user_id = :userId', { userId })
      .andWhere('EXTRACT(YEAR FROM t.date)::int = :year', { year })
      .andWhere('EXTRACT(MONTH FROM t.date)::int = :month', { month })
      .setParameters({
        income: TransactionType.INCOME,
        expense: TransactionType.EXPENSE,
      })
      .getRawOne<{ income: string; expenses: string }>();

    return {
      income: Number(result?.income ?? 0),
      expenses: Number(result?.expenses ?? 0),
    };
  }
}
