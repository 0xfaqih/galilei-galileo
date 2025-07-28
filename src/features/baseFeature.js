import { Logger } from "../utils/logger.js";
import { RetryManager } from "../utils/retryManager.js";
import { TelegramNotifier } from "../utils/telegramNotifier.js";
import { provider, signer } from "../config/index.js";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { CONTRACTS } from "../config/constant.js";
import { CONFIG } from "../config/index.js";

export class BaseFeature {
  constructor(featureName) {
    this.featureName = featureName;
    this.retryManager = new RetryManager();
    this.telegramNotifier = new TelegramNotifier();
    this.logger = Logger.withFeature(featureName);
  }

  async checkBalance(walletAddress) {
    try {
      const balance = await provider.getBalance(walletAddress);
      return parseFloat(ethers.formatEther(balance)).toFixed(6);
    } catch (error) {
      this.logger.error(`Failed to get wallet balance: ${error.message}`);
      return "0.000000";
    }
  }

  async checkTokenBalance(tokenAddress, walletAddress) {
    try {
      const abiPath = path.resolve("ERC20_abi.json");
      const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
      const contract = new ethers.Contract(tokenAddress, abi, provider);
      const [balance, symbol, decimals] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.symbol(),
        contract.decimals(),
      ]);
      return `${ethers.formatUnits(balance, decimals)} ${symbol}`;
    } catch (error) {
      this.logger.error(`Failed to get token balance: ${error.message}`);
      return "0";
    }
  }

  async execute(context = {}) {
    const walletAddress = signer.address;
    const walletLogger = Logger.withWallet(walletAddress);

    this.logger.info(`Starting ${this.featureName} execution`);

    try {
      const balance = await this.checkBalance(walletAddress);
      walletLogger.info(`Wallet balance: ${balance} ${CONFIG.TOKEN_SYMBOL}`);

      const usdtBalance = await this.checkTokenBalance(
        CONTRACTS.USDT,
        walletAddress
      );
      const ethTokenBalance = await this.checkTokenBalance(
        CONTRACTS.ETH,
        walletAddress
      );
      const btcBalance = await this.checkTokenBalance(
        CONTRACTS.BTC,
        walletAddress
      );
      walletLogger.info(`USDT Token balance: ${usdtBalance}`);
      walletLogger.info(`ETH Token balance: ${ethTokenBalance}`);
      walletLogger.info(`BTC Token balance: ${btcBalance}`);

      const result = await this.retryManager.executeWithRetry(
        () => this.performAction(context),
        this.featureName,
        { ...context, wallet: walletAddress, balance }
      );

      await this.telegramNotifier.sendSuccess(this.featureName, {
        ...context,
        wallet: walletAddress,
        balance,
        ...result,
      });

      this.logger.success(`${this.featureName} completed successfully`);

      return {
        success: true,
        feature: this.featureName,
        wallet: walletAddress,
        balance,
        ...result,
      };
    } catch (error) {
      await this.telegramNotifier.sendWalletError(
        walletAddress,
        this.featureName,
        error,
        context
      );

      this.logger.failure(`${this.featureName} failed: ${error.message}`);

      return {
        success: false,
        feature: this.featureName,
        wallet: walletAddress,
        error: error.message,
      };
    }
  }

  async performAction(context) {
    throw new Error("performAction method must be implemented by child class");
  }

  validateContext(context) {
    return true;
  }

  async preExecutionChecks(context) {
    return true;
  }

  async postExecutionCleanup(context, result) {
    return true;
  }
}
