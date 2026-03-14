import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity.js';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionResponseDto,
  ListTransactionsQueryDto,
} from './dto/index.js';
import { CategoriesService } from '../categories/categories.service.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    await this.validateCategoryForUser(dto.categoryId, userId);

    const transaction = this.transactionsRepository.create({
      ...dto,
      userId,
    });
    const saved = await this.transactionsRepository.save(transaction);
    return TransactionResponseDto.fromEntity(saved);
  }

  async findAll(
    userId: string,
    query: ListTransactionsQueryDto,
  ): Promise<PaginatedResponseDto<TransactionResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .where('t.user_id = :userId', { userId });

    if (query.type) {
      qb.andWhere('t.type = :type', { type: query.type });
    }
    if (query.categoryId) {
      qb.andWhere('t.category_id = :categoryId', {
        categoryId: query.categoryId,
      });
    }
    if (query.paymentMethod) {
      qb.andWhere('t.payment_method = :paymentMethod', {
        paymentMethod: query.paymentMethod,
      });
    }
    if (query.startDate) {
      qb.andWhere('t.date >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('t.date <= :endDate', { endDate: query.endDate });
    }

    qb.orderBy('t.date', 'DESC')
      .addOrderBy('t.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [transactions, total] = await qb.getManyAndCount();

    const data = transactions.map((t) => TransactionResponseDto.fromEntity(t));
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(
    userId: string,
    transactionId: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.findOwnedTransaction(userId, transactionId);
    return TransactionResponseDto.fromEntity(transaction);
  }

  async update(
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.findOwnedTransaction(userId, transactionId);

    if (dto.categoryId) {
      await this.validateCategoryForUser(dto.categoryId, userId);
    }

    Object.assign(transaction, dto);
    const saved = await this.transactionsRepository.save(transaction);
    return TransactionResponseDto.fromEntity(saved);
  }

  async remove(userId: string, transactionId: string): Promise<void> {
    const transaction = await this.findOwnedTransaction(userId, transactionId);
    await this.transactionsRepository.remove(transaction);
  }

  private async findOwnedTransaction(
    userId: string,
    transactionId: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOneBy({
      id: transactionId,
    });
    if (!transaction) {
      throw new NotFoundException(
        `Transacción con id ${transactionId} no encontrada`,
      );
    }
    if (transaction.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a esta transacción',
      );
    }
    return transaction;
  }

  async sumExpensesByCategory(
    userId: string,
    categoryId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const result = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.user_id = :userId', { userId })
      .andWhere('t.category_id = :categoryId', { categoryId })
      .andWhere('t.type = :type', { type: 'EXPENSE' })
      .andWhere('t.date >= :startDate', { startDate })
      .andWhere('t.date <= :endDate', { endDate })
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
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
