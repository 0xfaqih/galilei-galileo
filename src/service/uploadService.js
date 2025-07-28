import { Indexer, ZgFile } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import { CONFIG, provider, signer } from "../config/index.js";
import { Logger } from "../utils/logger.js";

export class UploadService {
  constructor() {
    this.indexer = new Indexer(CONFIG.INDEXER_RPC, signer);
    this.logger = Logger.withFeature('Upload Service');
  }

  async upload(path) {
    this.logger.info(`Starting upload: ${path}`);
    
    try {
      const file = await ZgFile.fromFilePath(path);
      const [tree] = await file.merkleTree();

      this.logger.info(`Merkle root: ${tree.rootHash()}`);

      const balance = await provider.getBalance(signer.address);
      this.logger.info(`Wallet balance: ${ethers.formatEther(balance)} 0G`);

      const tx = await this.indexer.upload(file, CONFIG.RPC_URL, signer);

      if (Array.isArray(tx)) {
        const [txHash] = tx;
        if (txHash && typeof txHash === "string") {
          this.logger.success(`File uploaded successfully! txHash: ${txHash}`);
        } else {
          this.logger.warn("File might already exist or duplicate transaction skipped.");
        }
        return tx;
      } else {
        this.logger.success(`File uploaded (non-array result): ${tx}`);
        return tx;
      }
    } catch (error) {
      this.logger.error(`Upload failed for ${path}: ${error.message}`);
      throw error;
    }
  }

  async getWalletBalance() {
    const balance = await provider.getBalance(signer.address);
    return ethers.formatEther(balance);
  }
} 