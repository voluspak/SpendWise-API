import { IsEnum, IsOptional } from 'class-validator';

export enum StatsPeriod {
  Month = 'month',
  Year = 'year',
  All = 'all',
}

export class AdminOverviewQueryDto {
  @IsOptional()
  @IsEnum(StatsPeriod)
  period?: StatsPeriod;
}
