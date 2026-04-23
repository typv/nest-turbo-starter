import * as dotenv from 'dotenv';
import { NodeEnv } from '@app/common';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { registerAs } from '@nestjs/config';
import * as entities from '../data-access/all.entity';

dotenv.config();

export const databaseConfig = {
  driver: PostgreSqlDriver,
  dbName: process.env.PRODUCT_SERVICE_DB_DATABASE || '',
  host: process.env.PRODUCT_SERVICE_DB_HOST || 'localhost',
  port: process.env.PRODUCT_SERVICE_DB_PORT
    ? Number(process.env.PRODUCT_SERVICE_DB_PORT)
    : 5432,
  user: process.env.PRODUCT_SERVICE_DB_USERNAME || '',
  password: process.env.PRODUCT_SERVICE_DB_PASSWORD || '',
  schema: process.env.PRODUCT_SERVICE_DB_SCHEMA || 'public',
  baseDir: __dirname,
  debug: process.env.PRODUCT_SERVICE_NODE_ENV === NodeEnv.Production,
  entities: Object.values(entities),
  cache: {
    enabled: false,
  },
};

export const dbConfiguration = registerAs('database', () => databaseConfig);
