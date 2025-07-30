import { Logger } from '../utils/logger.js';
import { CooldownManager } from '../utils/cooldownManager.js';
import { TelegramNotifier } from '../utils/telegramNotifier.js';
import { UploadFeature } from '../features/uploadFeature.js';
import { SwapFeature } from '../features/swapFeature.js';
import { AddLiquidityFeature } from '../features/addLiquidityFeature.js';

export class AutomationManager {
  constructor() {
    this.telegramNotifier = new TelegramNotifier();
    this.features = [
      new UploadFeature(),
      new SwapFeature('jaine', 3),   
      new AddLiquidityFeature('jaine', 3),  
      new SwapFeature('zer0', 2),       
      // new AddLiquidityFeature('zer0', 2)  
    ];
    
    this.stats = {
      totalRuns: 0,
      successful: 0,
      failed: 0,
      features: {},
      startTime: new Date(),
      lastRunTime: null
    };
  }

  async run() {
    Logger.info('Starting 0G Automation Manager');
    Logger.info(`Loaded ${this.features.length} features`);
    
    const dexFeatures = this.getDexFeatures();
    const dexInfo = dexFeatures.map(f => `${f.type.toUpperCase()} (${f.dexType}, ${f.executionCount}x)`).join(', ');
    
    await this.telegramNotifier.sendMessage(
      `<b>🚀 0G AUTOMATION STARTED</b>\n` +
      `<b>Time:</b> ${new Date().toLocaleString('id-ID')}\n` +
      `<b>Features:</b> ${this.features.map(f => f.featureName).join(', ')}\n` +
      `<b>DEX Features:</b> ${dexInfo}\n` +
      `<b>Status:</b> Running continuously`
    );

    while (true) {
      try {
        await this.executeCycle();
        await CooldownManager.waitForCooldown();
      } catch (error) {
        Logger.error(`Critical error in automation loop: ${error.message}`);
        
        await this.telegramNotifier.sendMessage(
          `<b>💥 CRITICAL ERROR</b>\n` +
          `<b>Time:</b> ${new Date().toLocaleString('id-ID')}\n` +
          `<b>Error:</b> ${error.message}\n` +
          `<b>Status:</b> Restarting in 5 minutes...`
        );
        
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      }
    }
  }

  async executeCycle() {
    this.stats.totalRuns++;
    this.stats.lastRunTime = new Date();
    
    Logger.info(`Starting automation cycle #${this.stats.totalRuns}`);
    
    const cycleResults = [];
    const cycleStartTime = Date.now();
    
    for (const feature of this.features) {
      try {
        Logger.info(`Executing feature: ${feature.featureName}`);
        
        const result = await feature.execute({
          cycleNumber: this.stats.totalRuns,
          featureName: feature.featureName
        });
        
        cycleResults.push(result);
        
        if (result.success) {
          this.stats.successful++;
          this.stats.features[feature.featureName] = 
            (this.stats.features[feature.featureName] || 0) + 1;
        } else {
          this.stats.failed++;
        }
        
        Logger.info(`Feature ${feature.featureName} completed with status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        
      } catch (error) {
        Logger.error(`Unexpected error in feature ${feature.featureName}: ${error.message}`);
        this.stats.failed++;
        
        cycleResults.push({
          success: false,
          feature: feature.featureName,
          error: error.message
        });
      }
    }
    
    const cycleDuration = Date.now() - cycleStartTime;
    
    const successfulFeatures = cycleResults.filter(r => r.success).length;
    const failedFeatures = cycleResults.filter(r => !r.success).length;
    
    Logger.info(`Cycle #${this.stats.totalRuns} completed | Duration: ${cycleDuration}ms | Success: ${successfulFeatures}/${cycleResults.length}`);
    
    if (failedFeatures > 0) {
      await this.sendCycleSummary(cycleResults, cycleDuration);
    }
    
    const hoursSinceStart = (Date.now() - this.stats.startTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceStart >= 24 && this.stats.totalRuns % 24 === 0) {
      await this.sendDailyReport();
    }
  }

  async sendCycleSummary(results, duration) {
    const failedFeatures = results.filter(r => !r.success);
    
    let message = `<b>📊 CYCLE SUMMARY</b>\n`;
    message += `<b>Cycle:</b> #${this.stats.totalRuns}\n`;
    message += `<b>Duration:</b> ${duration}ms\n`;
    message += `<b>Status:</b> ${failedFeatures.length > 0 ? '⚠️ Partial Success' : '✅ All Success'}\n\n`;
    
    if (failedFeatures.length > 0) {
      message += `<b>Failed Features:</b>\n`;
      failedFeatures.forEach(result => {
        message += `• ${result.feature}: ${result.error}\n`;
      });
    }
    
    await this.telegramNotifier.sendMessage(message);
  }

  async sendDailyReport() {
    const reportStats = {
      totalRuns: this.stats.totalRuns,
      successful: this.stats.successful,
      failed: this.stats.failed,
      features: this.stats.features,
      uptime: this.getUptime()
    };
    
    await this.telegramNotifier.sendDailyReport(reportStats);
  }

  getUptime() {
    const uptime = Date.now() - this.stats.startTime.getTime();
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  addFeature(feature) {
    this.features.push(feature);
    Logger.info(`Added new feature: ${feature.featureName}`);
  }

  addDexFeature(featureType, dexType, executionCount = 1) {
    let feature;
    switch (featureType.toLowerCase()) {
      case 'swap':
        feature = new SwapFeature(dexType, executionCount);
        break;
      case 'liquidity':
        feature = new AddLiquidityFeature(dexType, executionCount);
        break;
      default:
        throw new Error(`Unsupported feature type: ${featureType}`);
    }
    
    this.features.push(feature);
    Logger.info(`Added new DEX feature: ${feature.featureName} for ${dexType.toUpperCase()} DEX with ${executionCount} execution(s) per cycle`);
    return feature;
  }

  removeDexFeature(featureType, dexType) {
    const featureIndex = this.features.findIndex(f => 
      (f instanceof SwapFeature || f instanceof AddLiquidityFeature) &&
      f.dexType === dexType &&
      (featureType === 'swap' ? f instanceof SwapFeature : f instanceof AddLiquidityFeature)
    );
    
    if (featureIndex !== -1) {
      const removedFeature = this.features.splice(featureIndex, 1)[0];
      Logger.info(`Removed DEX feature: ${removedFeature.featureName} for ${dexType.toUpperCase()} DEX`);
      return removedFeature;
    }
    
    return null;
  }

  getDexFeatures() {
    const dexFeatures = this.features.filter(f => f instanceof SwapFeature || f instanceof AddLiquidityFeature);
    return dexFeatures.map(f => ({
      featureName: f.featureName,
      dexType: f.dexType,
      type: f instanceof SwapFeature ? 'swap' : 'liquidity',
      executionCount: f.executionCount
    }));
  }

  getStatus() {
    const dexFeatures = this.features.filter(f => f instanceof SwapFeature || f instanceof AddLiquidityFeature);
    const dexInfo = dexFeatures.map(f => `${f.featureName} (${f.dexType}, ${f.executionCount}x)`);
    
    return {
      isRunning: true,
      totalRuns: this.stats.totalRuns,
      successful: this.stats.successful,
      failed: this.stats.failed,
      successRate: this.stats.totalRuns > 0 ? 
        ((this.stats.successful / this.stats.totalRuns) * 100).toFixed(2) + '%' : '0%',
      uptime: this.getUptime(),
      lastRun: this.stats.lastRunTime,
      features: this.features.map(f => f.featureName),
      dexFeatures: dexInfo
    };
  }
} 