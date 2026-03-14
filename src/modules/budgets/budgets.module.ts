import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from './entities/budget.entity.js';
import { BudgetsController } from './budgets.controller.js';
import { BudgetsService } from './budgets.service.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget]),
    CategoriesModule,
    TransactionsModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
