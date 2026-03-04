import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { User } from '../users/entities/user.entity.js';
import { StatisticsService } from './statistics.service.js';
import { StatisticsController } from './statistics.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Category, User])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
