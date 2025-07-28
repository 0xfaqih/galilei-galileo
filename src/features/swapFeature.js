import { BaseFeature } from './baseFeature.js';
import { createDexInstance } from './dex/index.js';
import { signer } from '../config/index.js';

export class SwapFeature extends BaseFeature {
  constructor(dexType = 'zer0', executionCount = 1) {
    super('Token Swap');
    this.dexType = dexType;
    this.dex = null;
    this.executionCount = executionCount;
  }

  async initializeDex() {
    if (!this.dex) {
      this.dex = await createDexInstance(this.dexType);
    }
    return this.dex;
  }

  async createDex(dexType) {
    return await createDexInstance(dexType);
  }

  async getRandomTokenPair() {
    await this.initializeDex();
    return this.dex.getRandomTokenPair();
  }

  async getAvailableTokens() {
    await this.initializeDex();
    return this.dex.getAvailableTokens();
  }

  async getRandomAmount(min = 0.01, max = 0.1) {
    await this.initializeDex();
    return this.dex.getRandomAmount(min, max);
  }

  async performAction(context) {
    await this.initializeDex();
    const results = [];
    
    for (let i = 0; i < this.executionCount; i++) {
      this.logger.info(`Executing swap #${i + 1}/${this.executionCount} on ${this.dexType.toUpperCase()} DEX`);
      
      let tokenPair = await this.getRandomTokenPair();
      let swapAmount = await this.getRandomAmount(context.minAmount, context.maxAmount);
      
      this.logger.info(`Performing swap on ${this.dexType.toUpperCase()} DEX: ${swapAmount} ${tokenPair.tokenInName} to ${tokenPair.tokenOutName}`);
      
      const result = await this.dex.performSwap(tokenPair, swapAmount, context);
      results.push({
        executionNumber: i + 1,
        tokenPair,
        swapAmount,
        result
      });
      
      if (i < this.executionCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    return {
      totalExecutions: this.executionCount,
      executions: results,
      summary: `Completed ${this.executionCount} swap(s) on ${this.dexType.toUpperCase()} DEX`
    };
  }

  async preExecutionChecks(context) {
    await this.initializeDex();
    
    for (let i = 0; i < this.executionCount; i++) {
      let tokenPair = await this.getRandomTokenPair();
      let swapAmount = await this.getRandomAmount(context.minAmount, context.maxAmount);
      
      const tokenInBalanceStr = await this.checkTokenBalance(tokenPair.tokenInAddress, await signer.getAddress());
      const tokenInBalance = parseFloat(tokenInBalanceStr.split(' ')[0]);
      if (tokenInBalance < swapAmount) {
        throw new Error(`${tokenPair.tokenInName} balance not enough for swap ${swapAmount}. Balance: ${tokenInBalance}`);
      }
    }
    
    this.logger.info(`DEX: ${this.dexType.toUpperCase()}`);
    this.logger.info(`Execution Count: ${this.executionCount}`);
    this.logger.info(`Will perform ${this.executionCount} swap(s) per cycle`);
    return true;
  }

  async setDex(dexType) {
    this.dexType = dexType;
    this.dex = await this.createDex(dexType);
    this.logger.info(`Switched to ${dexType.toUpperCase()} DEX`);
  }

  async getCurrentDex() {
    await this.initializeDex();
    return {
      type: this.dexType,
      name: this.dex.dexName,
      swapContract: this.dex.getSwapContract(),
      liquidityContract: this.dex.getLiquidityContract()
    };
  }
} 