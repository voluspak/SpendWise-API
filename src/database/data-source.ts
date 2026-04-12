import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config/app/index.js';

const { postgres } = config;

export default new DataSource({
  type: 'postgres',
  host: postgres.database.host,
  port: postgres.database.port,
  username: postgres.database.username,
  password: postgres.database.password,
  database: postgres.database.name,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
