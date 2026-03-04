import { TransactionType, PaymentMethod } from '../../../common/enums/index.js';
import { Transaction } from '../entities/transaction.entity.js';

export class TransactionResponseDto {
  id!: string;
  type!: TransactionType;
  amount!: number;
  date!: string;
  description!: string | null;
  paymentMethod!: PaymentMethod;
  categoryId!: string;
  userId!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(transaction: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = transaction.id;
    dto.type = transaction.type;
    dto.amount = Number(transaction.amount);
    dto.date = transaction.date;
    dto.description = transaction.description;
    dto.paymentMethod = transaction.paymentMethod;
    dto.categoryId = transaction.categoryId;
    dto.userId = transaction.userId;
    dto.createdAt = transaction.createdAt;
    dto.updatedAt = transaction.updatedAt;
    return dto;
  }
}
