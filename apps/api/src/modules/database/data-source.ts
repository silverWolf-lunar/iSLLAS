import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(__dirname, '../../../../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const isSsl =
  process.env.DB_SSL === 'true' ||
  Boolean(
    process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes('localhost') &&
      !process.env.DATABASE_URL.includes('127.0.0.1'),
  );

const sslConfig = isSsl ? { rejectUnauthorized: false } : false;

const migrationCandidates = [
  path.resolve(process.cwd(), 'database/migrations/*{.ts,.js}'),
  path.resolve(__dirname, '../../../../../database/migrations/*{.ts,.js}'),
  path.resolve(__dirname, '../../../../database/migrations/*{.ts,.js}'),
  path.resolve(__dirname, '../../../database/migrations/*{.ts,.js}'),
];

export const dataSourceOptions: DataSourceOptions = process.env.DATABASE_URL
  ? {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [path.join(__dirname, '../../**/*.entity{.ts,.js}')],
      migrations: migrationCandidates,
      synchronize: process.env.DB_SYNCHRONIZE === 'true', // Never true in prod
      logging: process.env.NODE_ENV === 'development',
      ssl: sslConfig,
      extra: isSsl ? { ssl: { rejectUnauthorized: false } } : undefined,
    }
  : {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'sllas',
      entities: [path.join(__dirname, '../../**/*.entity{.ts,.js}')],
      migrations: migrationCandidates,
      synchronize: process.env.DB_SYNCHRONIZE === 'true', // Never true in prod
      logging: process.env.NODE_ENV === 'development',
      ssl: sslConfig,
      extra: isSsl ? { ssl: { rejectUnauthorized: false } } : undefined,
    };

export const AppDataSource = new DataSource(dataSourceOptions);

