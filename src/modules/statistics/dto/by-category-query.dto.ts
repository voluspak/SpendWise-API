import { IsDateString, IsOptional } from 'class-validator';
import { TransactionType } from '../../../common/enums';

export class ByCategoryQueryDto {
  @IsOptional()
  type?: TransactionType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
