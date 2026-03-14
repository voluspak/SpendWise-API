import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { StatisticsModule } from './modules/statistics/statistics.module.js';
import { BudgetsModule } from './modules/budgets/budgets.module.js';
import { validate } from './config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    TransactionsModule,
    StatisticsModule,
    BudgetsModule,
  ],
})
export class AppModule {}
