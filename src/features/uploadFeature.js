import { BaseFeature } from './baseFeature.js';
import { FileGenerator } from '../utils/fileGenerator.js';
import { FileManager } from '../utils/fileManager.js';
import { UploadService } from '../service/uploadService.js';
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { CONFIG } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

export class UploadFeature extends BaseFeature {
  constructor() {
    super('File Upload');
    this.fileGenerator = new FileGenerator(projectRoot);
    this.uploadService = new UploadService();
  }

  async performAction(context) {
    let outputPath = null;
    
    try {
      outputPath = await this.fileGenerator.generateRandomFile();
      
      const fs = await import('fs/promises');
      const stats = await fs.stat(outputPath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      
      this.logger.info(`Generated file: ${outputPath} (${fileSizeKB} KB)`);
      
      const tx = await this.uploadService.upload(outputPath);
      const [txHash] = Array.isArray(tx) ? tx : [null];
      
      if (outputPath) {
        await FileManager.deleteFile(outputPath);
        this.logger.info('Temporary file cleaned up after upload');
      }
      
      return {
        txHash,
        fileSize: fileSizeKB,
        filePath: outputPath
      };
      
    } catch (error) {
      if (outputPath) {
        await FileManager.deleteFile(outputPath);
        this.logger.info('Cleaned up temporary file after upload failure');
      }
      throw error;
    }
  }

  async preExecutionChecks(context) {
    const balance = await this.getWalletBalance();
    const minBalance = 0.001;
    
    if (parseFloat(balance) < minBalance) {
      throw new Error(`Insufficient balance: ${balance} ${CONFIG.TOKEN_SYMBOL} (minimum: ${minBalance} ${CONFIG.TOKEN_SYMBOL})`);
    }
    
    return true;
  }
} 