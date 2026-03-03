import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  dateFormat?: string;
}
