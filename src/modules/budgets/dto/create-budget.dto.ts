import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { BudgetPeriod } from '../../../common/enums/index.js';

export class CreateBudgetDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amountLimit!: number;

  @IsEnum(BudgetPeriod)
  period!: BudgetPeriod;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  alertThreshold?: number;
}
