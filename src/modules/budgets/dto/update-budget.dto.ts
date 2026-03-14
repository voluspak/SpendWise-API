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

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amountLimit?: number;

  @IsOptional()
  @IsEnum(BudgetPeriod)
  period?: BudgetPeriod;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  alertThreshold?: number;
}
