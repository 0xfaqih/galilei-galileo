import { CONFIG } from '../config/index.js';
import { Logger } from './logger.js';

export class CooldownManager {
  static generateRandomCooldown() {
    const minHours = CONFIG.COOLDOWN_RANGE.MIN_HOURS;
    const maxHours = CONFIG.COOLDOWN_RANGE.MAX_HOURS;
    const minMinutes = CONFIG.COOLDOWN_RANGE.MIN_MINUTES;
    const maxMinutes = CONFIG.COOLDOWN_RANGE.MAX_MINUTES;

    const hours = Math.floor(Math.random() * (maxHours - minHours + 1)) + minHours;
    const minutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;

    const totalMilliseconds = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    
    return {
      hours,
      minutes,
      totalMilliseconds,
      nextRunTime: new Date(Date.now() + totalMilliseconds)
    };
  }

  static async waitForCooldown() {
    const cooldown = this.generateRandomCooldown();
    
    Logger.info(`Starting cooldown period | Duration: ${cooldown.hours}h ${cooldown.minutes}m | Next run: ${cooldown.nextRunTime.toLocaleString('id-ID')}`);

    Logger.info(`Next run scheduled for: ${cooldown.nextRunTime.toLocaleString('id-ID')}`);

    await this.delay(cooldown.totalMilliseconds);
    
    Logger.info('Cooldown period completed, resuming operations');
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static formatDuration(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (seconds > 0) result += `${seconds}s`;

    return result.trim();
  }

  static getTimeUntilNextRun(nextRunTime) {
    const now = new Date();
    const timeDiff = nextRunTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return 'Ready to run';
    }
    
    return this.formatDuration(timeDiff);
  }
} 