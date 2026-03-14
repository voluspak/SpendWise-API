import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Category } from '../../categories/entities/category.entity.js';
import { BudgetPeriod } from '../../../common/enums/index.js';

@Entity('budgets')
@Unique('UQ_budgets_user_category_period', ['userId', 'categoryId', 'period'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount_limit' })
  amountLimit!: number;

  @Column({ type: 'enum', enum: BudgetPeriod })
  period!: BudgetPeriod;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId!: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'integer', name: 'alert_threshold', default: 80 })
  alertThreshold!: number;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;
}
