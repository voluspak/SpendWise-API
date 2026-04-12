import { IsNotEmpty, IsString } from 'class-validator';

export class EnvironmentVariablesTemplate {
  @IsString()
  @IsNotEmpty()
  ENV_KEY!: string;

  @IsString()
  @IsNotEmpty()
  SW_jwt_secret!: string;

  @IsString()
  @IsNotEmpty()
  SW_jwt_refresh_secret!: string;

  @IsString()
  @IsNotEmpty()
  SW_postgres_database_name!: string;

  @IsString()
  @IsNotEmpty()
  SW_postgres_database_host!: string;

  @IsString()
  @IsNotEmpty()
  SW_postgres_database_port!: string;

  @IsString()
  @IsNotEmpty()
  SW_postgres_database_username!: string;

  @IsString()
  @IsNotEmpty()
  SW_postgres_database_password!: string;
}
