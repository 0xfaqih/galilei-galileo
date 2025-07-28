import { unlink } from "fs/promises";
import { Logger } from "./logger.js";

export class FileManager {
  static async deleteFile(filePath) {
    try {
      await unlink(filePath);
      Logger.info(`File deleted: ${filePath}`);
      return true;
    } catch (error) {
      Logger.error(`Failed to delete file ${filePath}: ${error.message}`);
      return false;
    }
  }

  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
} 