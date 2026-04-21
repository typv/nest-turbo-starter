import * as dotenv from 'dotenv';
import { NodeEnv } from '@app/common';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { registerAs } from '@nestjs/config';
import * as entities from '../data-access/all.entity';

dotenv.config();

export const databaseConfig = {
  metadataProvider: ReflectMetadataProvider,
  driver: PostgreSqlDriver,
  dbName: process.env.USER_SERVICE_DB_DATABASE || '',
  host: process.env.USER_SERVICE_DB_HOST || 'localhost',
  port: process.env.USER_SERVICE_DB_PORT
    ? Number(process.env.USER_SERVICE_DB_PORT)
    : 5432,
  user: process.env.USER_SERVICE_DB_USERNAME || '',
  password: process.env.USER_SERVICE_DB_PASSWORD || '',
  schema: process.env.USER_SERVICE_DB_SCHEMA || 'public',
  baseDir: __dirname,
  debug: process.env.USER_SERVICE_NODE_ENV === NodeEnv.Production,
  entities: Object.values(entities),
  cache: {
    enabled: false,
  },
};

export const dbConfiguration = registerAs('database', () => databaseConfig);
