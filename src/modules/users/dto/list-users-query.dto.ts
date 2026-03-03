import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum UserStatusFilter {
  Active = 'active',
  Inactive = 'inactive',
  All = 'all',
}

export class ListUsersQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(UserStatusFilter)
  status?: UserStatusFilter = UserStatusFilter.All;
}
