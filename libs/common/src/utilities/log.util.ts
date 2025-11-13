import * as winston from 'winston';
import { INestApplication, LoggerService } from '@nestjs/common';
import chalk from 'chalk';
import { WinstonModuleOptions } from 'nest-winston';

export function getWinstonConfig(
  appName: string,
  isProductionEnv: boolean,
): WinstonModuleOptions {
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ level: true, message: true }),
    winston.format.json(),
    winston.format.printf((info) => {
      const { level, message, timestamp, context: ctx, error: err, ...metadata } = info;
      const appPrefix = chalk.blue(`[${appName}]`);
      const context = chalk.cyan(`[${ctx || 'Application'}]`);

      const error = info.error;
      let errorOutput = '';
      if (err instanceof Error) {
        errorOutput = `\n\t${chalk.red(err)}`;
      }

      let metadataOutput = '';
      if (Object.keys(metadata).length > 0) {
        // Format metadata nicely for console
        if (isProductionEnv) {
          // Compact format for production
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
        level: isProductionEnv ? 'info' : 'debug',
        format: consoleFormat,
        handleExceptions: true,
      }),
    ],
  };
};

interface LogBootstrapOptions {
  isProductionEnv: boolean;
  logger: LoggerService;
  appPort: number;
  tcpListener?: Record<string, any>;
}

export function logBootstrapInfo(
  app: INestApplication,
  logOptions: LogBootstrapOptions,
): void {
  const { tcpListener, isProductionEnv, logger, appPort } = logOptions;

  if (isProductionEnv) {
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

  if (tcpListener) {
    logger.log({
      message: `TCP Microservice Listener is ready on ${chalk.blue(
        `${tcpListener?.host || 'Unknown'}:${tcpListener?.port || 'Unknown'}`,
      )}`,
      context: 'NestMicroservice',
    });
  }

  logger.log({
    message: `Application is ready. View Swagger at http://${host}:${appPort}/swagger`,
    context: 'Application',
  });
};
