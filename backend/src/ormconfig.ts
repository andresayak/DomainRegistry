import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

import * as entities from './domains/entities';

export const dataSourceOptions: DataSourceOptions = {
  name: 'default',
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  entities,
  migrationsTableName: 'custom_migration_table',
  migrations: [join(__dirname, 'database/migrations/*{.ts,.js}')],
  logging: false,
};

export default new DataSource(dataSourceOptions);
