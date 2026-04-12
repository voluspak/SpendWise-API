import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from '../config/app/index.js';

const { postgres, typeorm } = config;

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres' as const,
  host: postgres.database.host,
  port: postgres.database.port,
  username: postgres.database.username,
  password: postgres.database.password,
  database: postgres.database.name,
  autoLoadEntities: true,
  synchronize: false,
  logging: typeorm.logging,
};
