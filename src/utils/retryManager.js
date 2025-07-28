import { CONFIG } from '../config/index.js';
import { Logger } from './logger.js';
import { TelegramNotifier } from './telegramNotifier.js';

export class RetryManager {
  constructor() {
    this.telegramNotifier = new TelegramNotifier();
  }

  async executeWithRetry(operation, feature, context = {}) {
    const maxRetries = CONFIG.RETRY_CONFIG.MAX_RETRIES;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        Logger.info(`Attempting ${feature} (attempt ${attempt}/${maxRetries})`);
        
        const result = await operation();
        
        if (attempt > 1) {
          Logger.success(`${feature} succeeded on attempt ${attempt}`);
        } else {
          Logger.success(`${feature} completed successfully`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        Logger.error(`${feature} failed on attempt ${attempt}/${maxRetries}: ${error.message}`);

        await this.telegramNotifier.sendRetryInfo(feature, attempt, maxRetries, error);

        if (attempt < maxRetries) {
          const delay = this.calculateDelay(attempt);
          Logger.info(`Waiting ${delay}ms before retry`);
          await this.delay(delay);
        }
      }
    }

    Logger.failure(`${feature} failed after ${maxRetries} attempts: ${lastError.message}`);

    await this.telegramNotifier.sendFailure(feature, lastError, {
      ...context,
      attempt: maxRetries,
      maxRetries
    });

    throw lastError;
  }

  calculateDelay(attempt) {
    const baseDelay = CONFIG.RETRY_CONFIG.RETRY_DELAY;
    const multiplier = CONFIG.RETRY_CONFIG.BACKOFF_MULTIPLIER;
    return baseDelay * Math.pow(multiplier, attempt - 1);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeWithCustomRetry(operation, feature, customConfig = {}, context = {}) {
    const config = {
      maxRetries: CONFIG.RETRY_CONFIG.MAX_RETRIES,
      baseDelay: CONFIG.RETRY_CONFIG.RETRY_DELAY,
      backoffMultiplier: CONFIG.RETRY_CONFIG.BACKOFF_MULTIPLIER,
      ...customConfig
    };

    let lastError = null;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        Logger.info(`Attempting ${feature} (attempt ${attempt}/${config.maxRetries})`);
        
        const result = await operation();
        
        if (attempt > 1) {
          Logger.success(`${feature} succeeded on attempt ${attempt}`);
        } else {
          Logger.success(`${feature} completed successfully`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        Logger.error(`${feature} failed on attempt ${attempt}/${config.maxRetries}: ${error.message}`);

        await this.telegramNotifier.sendRetryInfo(feature, attempt, config.maxRetries, error);

        if (attempt < config.maxRetries) {
          const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
          Logger.info(`Waiting ${delay}ms before retry`);
          await this.delay(delay);
        }
      }
    }

    Logger.failure(`${feature} failed after ${config.maxRetries} attempts: ${lastError.message}`);

    await this.telegramNotifier.sendFailure(feature, lastError, {
      ...context,
      attempt: config.maxRetries,
      maxRetries: config.maxRetries
    });

    throw lastError;
  }
} 