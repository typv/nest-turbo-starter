import * as winston from 'winston';
import { INestApplication, LoggerService } from '@nestjs/common';
import chalk from 'chalk';
import { WinstonModuleOptions } from 'nest-winston';
import { NodeEnv } from '../enums';

export function getWinstonConfig(
  appName: string,
  nodeEnv: NodeEnv,
): WinstonModuleOptions {
  const isCriticalEnv = [NodeEnv.Production, NodeEnv.Staging].includes(nodeEnv);

  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ level: true, message: true }),
    winston.format.json(),
    winston.format.printf((info) => {
      const {
        level: _level,
        message: _message,
        timestamp: _timestamp,
        context: ctx,
        error: err,
        ...metadata
      } = info;
      const appPrefix = chalk.blue(`[${appName}]`);
      const context = chalk.cyan(`[${ctx || 'Application'}]`);

      let errorOutput = '';
      if (err instanceof Error) {
        errorOutput = `\n\t${chalk.red(err)}`;
      }

      let metadataOutput = '';
      if (Object.keys(metadata).length > 0) {
        // Format metadata nicely for console
        if (isCriticalEnv) {
          metadataOutput = ` | ${Object.entries(metadata)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' | ')}`;
        } else {
          // Pretty format for development
          metadataOutput = ` ${chalk.white(JSON.stringify(metadata))}`;
        }
      }

      if (info.message) {
        return `${appPrefix} - ${info.timestamp}   ${context} ${info.level}: ${info.message} ${metadataOutput} ${errorOutput}`;
      } else {
        return `${appPrefix} - ${info.timestamp}   ${context} ${info.level}: ${JSON.stringify(info)}`;
      }
    }),
  );

  return {
    transports: [
      // Console transport
      new winston.transports.Console({
        level: isCriticalEnv ? 'info' : 'debug',
        format: consoleFormat,
        handleExceptions: true,
      }),
    ],
  };
}

interface LogBootstrapOptions {
  nodeEnv: NodeEnv;
  logger: LoggerService;
  appPort: number;
  /** Transport-agnostic listener info, e.g. `{ transport: 'gRPC', address: '0.0.0.0:3311' }`. */
  msListener?: { transport: string; address?: string };
}

export function logBootstrapInfo(
  app: INestApplication,
  logOptions: LogBootstrapOptions,
): void {
  const { msListener, nodeEnv, logger, appPort } = logOptions;

  if (nodeEnv === NodeEnv.Production) {
    logger.log({
      message: `Application is running on port ${appPort}`,
      context: 'Application',
    });
    return;
  }

  const appAddressInfo = app.getHttpServer().address();
  let host = 'localhost';

  if (typeof appAddressInfo === 'object' && appAddressInfo !== null) {
    host = appAddressInfo.address === '::' ? 'localhost' : appAddressInfo.address;
  }

  if (msListener) {
    logger.log({
      message: `${msListener.transport} Microservice Listener is ready on ${chalk.blue(
        msListener.address || 'Unknown',
      )}`,
      context: 'NestMicroservice',
    });
  }

  logger.log({
    message: `Application is ready. View Swagger at http://${host}:${appPort}/swagger`,
    context: 'Application',
  });
}
