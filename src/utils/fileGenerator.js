import { writeFile } from "fs/promises";
import { join } from "path";
import { createCanvas } from "canvas";
import { randomBytes } from 'crypto';
import { CONFIG } from "../config/index.js";
import { Logger } from "./logger.js";

export class FileGenerator {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.logger = Logger.withFeature('File Generator');
  }

  getRandomExtension() {
    return CONFIG.FILE_EXTENSIONS[Math.floor(Math.random() * CONFIG.FILE_EXTENSIONS.length)];
  }

  getRandomFileSize(minKB = CONFIG.FILE_SIZE_RANGE.MIN_KB, maxKB = CONFIG.FILE_SIZE_RANGE.MAX_KB) {
    return Math.floor(Math.random() * (maxKB - minKB + 1) + minKB) * 1024;
  }

  generateRandomText(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  }

  generateRandomCSV(length) {
    const header = "id,name,score\n";
    const rows = Array.from(
      { length: Math.floor(length / 20) },
      (_, i) => `${i},Name${i},${Math.floor(Math.random() * 100)}`
    );
    return header + rows.join("\n");
  }

  generateRandomJSON(length) {
    const obj = {};
    const count = Math.floor(length / 50);
    for (let i = 0; i < count; i++) {
      obj[`key${i}`] = Math.random().toString(36).substring(2, 10);
    }
    return JSON.stringify(obj, null, 2);
  }

  generateRandomMarkdown(length) {
    let content = "# Random Markdown\n";
    const lines = Math.floor(length / 30);
    for (let i = 0; i < lines; i++) {
      content += `- Item ${i}: ${this.generateRandomText(10)}\n`;
    }
    return content;
  }

  generateRandomImageBuffer(targetSize) {
    const side = Math.ceil(Math.sqrt(targetSize / 4));
    const canvas = createCanvas(side, side);
    const ctx = canvas.getContext("2d");

    for (let y = 0; y < side; y++) {
      for (let x = 0; x < side; x++) {
        ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${
          Math.random() * 255
        })`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    return canvas.toBuffer("image/png");
  }

  async generateRandomFile() {
    const ext = this.getRandomExtension();
    const size = this.getRandomFileSize(10, 1024);
    const fileName = `data_${Date.now()}${ext}`;
    const filePath = join(this.baseDir, fileName);

    let content;
    switch (ext) {
      case ".txt":
        content = this.generateRandomText(size);
        break;
      case ".csv":
        content = this.generateRandomCSV(size);
        break;
      case ".json":
        content = this.generateRandomJSON(size);
        break;
      case ".md":
        content = this.generateRandomMarkdown(size);
        break;
      case ".bin":
        content = randomBytes(size);
        break;
      case ".png":
        content = this.generateRandomImageBuffer(size);
        break;
      default:
        content = this.generateRandomText(size);
    }

    await writeFile(filePath, content);
    this.logger.info(`Created file: ${fileName} | Size: ${(size / 1024).toFixed(2)} KB`);
    return filePath;
  }
} 