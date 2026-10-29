import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'sllas',
  entities: [path.join(__dirname, '../../**/*.entity{.ts,.js}')],
  // Migrations are repository-level assets, outside the Nest source tree. This
  // relative path works from both src/modules/database and dist/modules/database.
  migrations: [path.resolve(__dirname, '../../../../../database/migrations/*{.ts,.js}')],
  synchronize: process.env.DB_SYNCHRONIZE === 'true', // Never true in prod
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
