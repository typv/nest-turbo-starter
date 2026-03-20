import { Migrator } from '@mikro-orm/migrations';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import path from 'path';
import { databaseConfig } from 'src/config/database.config';

const cliConfig = {
  test: 'true',
  ...databaseConfig,
  migrations: {
    path: path.join(__dirname, 'src/database/migrations'),
  },
  extensions: [Migrator],
};

const ormConfig: MikroOrmModuleOptions = {
  ...databaseConfig,
  ...cliConfig,
};

export default ormConfig;
