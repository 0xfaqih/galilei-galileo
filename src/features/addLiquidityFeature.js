import { BaseFeature } from './baseFeature.js';
import { createDexInstance } from './dex/index.js';
import { signer } from '../config/index.js';

export class AddLiquidityFeature extends BaseFeature {
  constructor(dexType = 'zer0', executionCount = 1) {
    super('Add Liquidity');
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
    return this.dex.getRandomTokenPairForLiquidity();
  }

  async getRandomAmount(min = 0.001, max = 0.01) {
    await this.initializeDex();
    return this.dex.getRandomLiquidityAmount(min, max);
  }

  async performAction(context) {
    await this.initializeDex();
    const results = [];
    
    for (let i = 0; i < this.executionCount; i++) {
      this.logger.info(`Executing liquidity #${i + 1}/${this.executionCount} on ${this.dexType.toUpperCase()} DEX`);
      
      let tokenPair = await this.getRandomTokenPair();
      let amount0 = await this.getRandomAmount(context.minAmount, context.maxAmount);
      let amount1 = await this.getRandomAmount(context.minAmount, context.maxAmount);
      
      this.logger.info(`Adding liquidity on ${this.dexType.toUpperCase()} DEX: ${amount0} ${tokenPair.token0Name} + ${amount1} ${tokenPair.token1Name}`);
      
      const result = await this.dex.performAddLiquidity(tokenPair, amount0, amount1, context);
      results.push({
        executionNumber: i + 1,
        tokenPair,
        amount0,
        amount1,
        result
      });

      if (i < this.executionCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    return {
      totalExecutions: this.executionCount,
      executions: results,
      summary: `Completed ${this.executionCount} liquidity addition(s) on ${this.dexType.toUpperCase()} DEX`
    };
  }

  async preExecutionChecks(context) {
    await this.initializeDex();
    
    // Cek balance untuk semua eksekusi
    for (let i = 0; i < this.executionCount; i++) {
      let tokenPair = await this.getRandomTokenPair();
      
      let amount0 = await this.getRandomAmount(context.minAmount, context.maxAmount);
      let amount1 = await this.getRandomAmount(context.minAmount, context.maxAmount);
      
      const token0BalanceStr = await this.checkTokenBalance(tokenPair.token0Address, await signer.getAddress());
      const token0Balance = parseFloat(token0BalanceStr.split(' ')[0]);
      if (token0Balance < amount0) {
        throw new Error(`${tokenPair.token0Name} balance not enough for liquidity. Balance: ${token0Balance}, Required: ${amount0}`);
      }
      
      const token1BalanceStr = await this.checkTokenBalance(tokenPair.token1Address, await signer.getAddress());
      const token1Balance = parseFloat(token1BalanceStr.split(' ')[0]);
      if (token1Balance < amount1) {
        throw new Error(`${tokenPair.token1Name} balance not enough for liquidity. Balance: ${token1Balance}, Required: ${amount1}`);
      }
    }
    
    this.logger.info(`DEX: ${this.dexType.toUpperCase()}`);
    this.logger.info(`Execution Count: ${this.executionCount}`);
    this.logger.info(`Will perform ${this.executionCount} liquidity addition(s) per cycle`);
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