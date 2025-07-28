import TelegramBot from 'node-telegram-bot-api';
import { CONFIG } from '../config/index.js';
import { Logger } from './logger.js';

export class TelegramNotifier {
  constructor() {
    this.bot = null;
    this.isEnabled = CONFIG.TELEGRAM.ENABLED;
    
    if (this.isEnabled && CONFIG.TELEGRAM.BOT_TOKEN) {
      this.bot = new TelegramBot(CONFIG.TELEGRAM.BOT_TOKEN, { polling: false });
    }
  }

  async sendMessage(message, options = {}) {
    if (!this.isEnabled || !this.bot) {
      Logger.debug('Telegram notifications disabled or bot not configured');
      return;
    }

    try {
      const chatId = CONFIG.TELEGRAM.CHAT_ID;
      const threadId = CONFIG.TELEGRAM.THREAD_ID;
      
      const messageOptions = {
        parse_mode: 'HTML',
        ...options
      };

      if (threadId) {
        messageOptions.message_thread_id = threadId;
      }

      await this.bot.sendMessage(chatId, message, messageOptions);
      Logger.debug('Telegram message sent successfully');
    } catch (error) {
      Logger.error(`Failed to send Telegram message: ${error.message}`);
    }
  }

  async sendSuccess(feature, details = {}) {
    const message = this.formatSuccessMessage(feature, details);
    await this.sendMessage(message);
  }

  async sendFailure(feature, error, details = {}) {
    const message = this.formatFailureMessage(feature, error, details);
    await this.sendMessage(message);
  }

  async sendWalletError(walletAddress, feature, error, details = {}) {
    const message = this.formatWalletErrorMessage(walletAddress, feature, error, details);
    await this.sendMessage(message);
  }

  async sendRetryInfo(feature, attempt, maxRetries, error) {
    const message = this.formatRetryMessage(feature, attempt, maxRetries, error);
    await this.sendMessage(message);
  }

  formatSuccessMessage(feature, details) {
    let message = `<b>✅ SUCCESS</b>\n`;
    message += `<b>Feature:</b> ${feature}\n`;
    message += `<b>Time:</b> ${new Date().toLocaleString('id-ID')}\n`;
    
    if (details.wallet) {
      message += `<b>Wallet:</b> <code>${details.wallet}</code>\n`;
    }
    
    if (details.txHash) {
      message += `<b>Transaction:</b> <code>${details.txHash}</code>\n`;
    }
    
    if (details.balance) {
      message += `<b>Balance:</b> ${details.balance} ${CONFIG.TOKEN_SYMBOL}\n`;
    }
    
    if (details.fileSize) {
      message += `<b>File Size:</b> ${details.fileSize} KB\n`;
    }
    
    return message;
  }

  formatFailureMessage(feature, error, details) {
    let message = `<b>❌ FAILURE</b>\n`;
    message += `<b>Feature:</b> ${feature}\n`;
    message += `<b>Time:</b> ${new Date().toLocaleString('id-ID')}\n`;
    message += `<b>Error:</b> ${error.message || error}\n`;
    
    if (details.wallet) {
      message += `<b>Wallet:</b> <code>${details.wallet}</code>\n`;
    }
    
    if (details.attempt) {
      message += `<b>Attempt:</b> ${details.attempt}/${details.maxRetries}\n`;
    }
    
    return message;
  }

  formatWalletErrorMessage(walletAddress, feature, error, details) {
    let message = `<b>⚠️ WALLET ERROR</b>\n`;
    message += `<b>Wallet:</b> <code>${walletAddress}</code>\n`;
    message += `<b>Feature:</b> ${feature}\n`;
    message += `<b>Time:</b> ${new Date().toLocaleString('id-ID')}\n`;
    message += `<b>Error:</b> ${error.message || error}\n`;
    
    if (details.balance) {
      message += `<b>Balance:</b> ${details.balance} ${CONFIG.TOKEN_SYMBOL}\n`;
    }
    
    return message;
  }

  formatRetryMessage(feature, attempt, maxRetries, error) {
    let message = `<b>🔄 RETRY ATTEMPT</b>\n`;
    message += `<b>Feature:</b> ${feature}\n`;
    message += `<b>Attempt:</b> ${attempt}/${maxRetries}\n`;
    message += `<b>Time:</b> ${new Date().toLocaleString('id-ID')}\n`;
    message += `<b>Error:</b> ${error.message || error}\n`;
    
    return message;
  }

  async sendDailyReport(stats) {
    const message = this.formatDailyReport(stats);
    await this.sendMessage(message);
  }

  formatDailyReport(stats) {
    let message = `<b>📊 DAILY REPORT</b>\n`;
    message += `<b>Date:</b> ${new Date().toLocaleDateString('id-ID')}\n`;
    message += `<b>Total Runs:</b> ${stats.totalRuns}\n`;
    message += `<b>Successful:</b> ${stats.successful}\n`;
    message += `<b>Failed:</b> ${stats.failed}\n`;
    message += `<b>Success Rate:</b> ${((stats.successful / stats.totalRuns) * 100).toFixed(2)}%\n`;
    
    if (stats.features) {
      message += `\n<b>Feature Breakdown:</b>\n`;
      Object.entries(stats.features).forEach(([feature, count]) => {
        message += `• ${feature}: ${count}\n`;
      });
    }
    
    return message;
  }
} 