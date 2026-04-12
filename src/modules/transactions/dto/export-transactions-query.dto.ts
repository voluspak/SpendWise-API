import { IsDateString, IsOptional } from 'class-validator';

export class ExportTransactionsQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
