import { fileURLToPath } from "url";
import { dirname } from "path";
import { FileGenerator } from "../utils/fileGenerator.js";
import { UploadService } from "../service/uploadService.js";
import { FileManager } from "../utils/fileManager.js";
import { CONFIG } from "../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class UploadManager {
  constructor() {
    this.fileGenerator = new FileGenerator(__dirname);
    this.uploadService = new UploadService();
  }

  async processUpload() {
    const attempts = Math.floor(Math.random() * CONFIG.MAX_ATTEMPTS) + 1;
    
    for (let i = 0; i < attempts; i++) {
      console.log(`\n📦 [${i + 1}/${attempts}] Process starting`);

      let outputPath = null;
      
      try {
        outputPath = await this.fileGenerator.generateRandomFile();

        const tx = await this.uploadService.upload(outputPath);
        const [txHash] = Array.isArray(tx) ? tx : [null];

        if (txHash && typeof txHash === "string") {
          await FileManager.deleteFile(outputPath);
        }

        console.log("✅ Process completed.");

        if (i < attempts - 1) {
          console.log("⏳ Wait for 2 minutes before the next attempt.");
          await FileManager.delay(CONFIG.DELAY_BETWEEN_ATTEMPTS);
        }
      } catch (err) {
        console.error("❌ Gagal:", err);
        
        if (outputPath) {
          await FileManager.deleteFile(outputPath);
        }
      }
    }
  }

  async run() {
    try {
      await this.processUpload();
      console.log("🎉 All upload processes completed!");
    } catch (error) {
      console.error("💥 Fatal error:", error);
      process.exit(1);
    }
  }
} 