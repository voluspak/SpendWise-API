import { IsDateString, IsOptional } from 'class-validator';

export class ByCategoryQueryDto {
  @IsOptional()
  type?: any;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
