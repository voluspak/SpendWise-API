import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity.js';
import { User } from '../users/entities/user.entity.js';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';
import { TransactionsExportService } from './export/transactions-export.service.js';
import { CategoriesModule } from '../categories/categories.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, User]), CategoriesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsExportService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
