import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { CONFIG } from '../config/index.js';
import chalk from 'chalk';

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, wallet, feature, error, ...meta }) => {
    let log = `${timestamp} `;
    
    switch (level) {
      case 'error':
        log += chalk.red(`[ERROR]`);
        break;
      case 'warn':
        log += chalk.yellow(`[WARN]`);
        break;
      case 'info':
        log += chalk.cyan(`[INFO]`);
        break;
      case 'debug':
        log += chalk.gray(`[DEBUG]`);
        break;
      case 'success':
        log += chalk.green(`[SUCCESS]`);
        break;
      default:
        log += chalk.white(`[${level.toUpperCase()}]`);
    }    
    
    if (wallet) {
      log += ` 💰 ${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    }
    
    if (feature) {
      log += chalk.blue(` 📋 ${feature}`)  ;
    }
    
    log += ` ${message}`;
    
    if (error && error.stack) {
      log += `\n${error.stack}`;
    }
    
    const importantMeta = {};
    if (meta.cycleNumber) importantMeta.cycle = meta.cycleNumber;
    if (meta.retryCount) importantMeta.retries = meta.retryCount;
    if (meta.duration) importantMeta.duration = meta.duration;
    if (meta.status) importantMeta.status = meta.status;
    
    if (Object.keys(importantMeta).length > 0) {
      log += ` | ${JSON.stringify(importantMeta)}`;
    }
    
    return log;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleTransport = new winston.transports.Console({
  format: consoleFormat
});

const fileTransport = new DailyRotateFile({
  filename: CONFIG.LOGGER.LOG_FILE,
  datePattern: 'YYYY-MM-DD',
  maxSize: CONFIG.LOGGER.MAX_SIZE,
  maxFiles: CONFIG.LOGGER.MAX_FILES,
  format: fileFormat
});

const errorFileTransport = new DailyRotateFile({
  filename: CONFIG.LOGGER.ERROR_FILE,
  datePattern: 'YYYY-MM-DD',
  maxSize: CONFIG.LOGGER.MAX_SIZE,
  maxFiles: CONFIG.LOGGER.MAX_FILES,
  level: 'error',
  format: fileFormat
});

const logger = winston.createLogger({
  level: CONFIG.LOGGER.LEVEL,
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    success: 2,
    debug: 3
  },
  transports: [
    consoleTransport,
    fileTransport,
    errorFileTransport
  ],
  exitOnError: false
});

export class Logger {
  static info(message, context = {}) {
    logger.info(message, context);
  }

  static error(message, context = {}) {
    logger.error(message, context);
  }

  static warn(message, context = {}) {
    logger.warn(message, context);
  }

  static debug(message, context = {}) {
    logger.debug(message, context);
  }

  static success(message, context = {}) {
    logger.log('success', `${message}`, context);
  }

  static failure(message, context = {}) {
    logger.error('error', `${message}`, context);
  }

  static withWallet(walletAddress) {
    return {
      info: (message, context = {}) => logger.info(message, { ...context, wallet: walletAddress }),
      error: (message, context = {}) => logger.error(message, { ...context, wallet: walletAddress }),
      warn: (message, context = {}) => logger.warn(message, { ...context, wallet: walletAddress }),
      debug: (message, context = {}) => logger.debug(message, { ...context, wallet: walletAddress }),
      success: (message, context = {}) => logger.log('success', `${message}`, { ...context, wallet: walletAddress }),
      failure: (message, context = {}) => logger.error('error', `${message}`, { ...context, wallet: walletAddress })
    };
  }

  static withFeature(featureName) {
    return {
      info: (message, context = {}) => logger.info(message, { ...context, feature: featureName }),
      error: (message, context = {}) => logger.error(message, { ...context, feature: featureName }),
      warn: (message, context = {}) => logger.warn(message, { ...context, feature: featureName }),
      debug: (message, context = {}) => logger.debug(message, { ...context, feature: featureName }),
      success: (message, context = {}) => logger.log('success', `${message}`, { ...context, feature: featureName }),
      failure: (message, context = {}) => logger.error('error', `${message}`, { ...context, feature: featureName })
    };
  }
}

export default logger; 