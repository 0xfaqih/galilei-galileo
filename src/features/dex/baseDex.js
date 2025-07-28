import { ethers } from 'ethers';
import { BaseFeature } from '../baseFeature.js';
import { CONTRACTS } from '../../config/constant.js';

export class BaseDex extends BaseFeature {
  constructor(dexName) {
    super(`${dexName} DEX`);
    this.dexName = dexName;
  }

  getSwapContract() {
    throw new Error('getSwapContract method must be implemented by child class');
  }

  getLiquidityContract() {
    throw new Error('getLiquidityContract method must be implemented by child class');
  }

  getSwapAbi() {
    throw new Error('getSwapAbi method must be implemented by child class');
  }

  getLiquidityAbi() {
    throw new Error('getLiquidityAbi method must be implemented by child class');
  }

  getRandomTokenPair() {
    const tokenKeys = Object.keys(CONTRACTS);
    
    const randomIndex1 = Math.floor(Math.random() * tokenKeys.length);
    let randomIndex2 = Math.floor(Math.random() * tokenKeys.length);
    
    while (randomIndex2 === randomIndex1) {
      randomIndex2 = Math.floor(Math.random() * tokenKeys.length);
    }
    
    const tokenInKey = tokenKeys[randomIndex1];
    const tokenOutKey = tokenKeys[randomIndex2];
    
    return {
      tokenInKey,
      tokenOutKey,
      tokenInAddress: CONTRACTS[tokenInKey],
      tokenOutAddress: CONTRACTS[tokenOutKey],
      tokenInName: tokenInKey,
      tokenOutName: tokenOutKey
    };
  }

  getRandomTokenPairForLiquidity() {
    const tokenKeys = Object.keys(CONTRACTS);
    
    const randomIndex1 = Math.floor(Math.random() * tokenKeys.length);
    let randomIndex2 = Math.floor(Math.random() * tokenKeys.length);
    
    while (randomIndex2 === randomIndex1) {
      randomIndex2 = Math.floor(Math.random() * tokenKeys.length);
    }
    
    const token0Key = tokenKeys[randomIndex1];
    const token1Key = tokenKeys[randomIndex2];
        
    const token0Address = CONTRACTS[token0Key];
    const token1Address = CONTRACTS[token1Key];
    
    if (token0Address.toLowerCase() < token1Address.toLowerCase()) {
      return {
        token0Key,
        token1Key,
        token0Address,
        token1Address,
        token0Name: token0Key,
        token1Name: token1Key
      };
    } else {
      return {
        token0Key: token1Key,
        token1Key: token0Key,
        token0Address: token1Address,
        token1Address: token0Address,
        token0Name: token1Key,
        token1Name: token0Key
      };
    }
  }

  getRandomAmount(min = 0.01, max = 0.1) {
    const amount = Math.random() * (max - min) + min;
    return Number(amount.toFixed(4));
  }

  getRandomLiquidityAmount(min = 0.001, max = 0.01) {
    const amount = Math.random() * (max - min) + min;
    return Number(amount.toFixed(5));
  }

  getAvailableTokens() {
    return Object.keys(CONTRACTS);
  }

  async performSwap(tokenPair, swapAmount, context) {
    throw new Error('performSwap method must be implemented by child class');
  }

  async performAddLiquidity(tokenPair, amount0, amount1, context) {
    throw new Error('performAddLiquidity method must be implemented by child class');
  }
} 