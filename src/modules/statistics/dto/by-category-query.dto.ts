import { IsDateString, IsOptional } from 'class-validator';

export class ByCategoryQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
