import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

export const CONFIG = {
  // 0G Network Configuration
  RPC_URL: "https://evmrpc-testnet.0g.ai",
  TOKEN_NAME: "0G Testnet",
  TOKEN_SYMBOL: "0G",
  TOKEN_DECIMALS: 18,
  INDEXER_RPC: "https://indexer-storage-testnet-turbo.0g.ai",
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  
  // File Configuration
  FILE_EXTENSIONS: [".txt", ".json", ".csv", ".bin", ".md", ".png"],
  FILE_SIZE_RANGE: {
    MIN_KB: 1,
    MAX_KB: 1024
  },
  
  // Automation Configuration
  COOLDOWN_RANGE: {
    MIN_HOURS: 10,
    MAX_HOURS: 16,
    MIN_MINUTES: 0,
    MAX_MINUTES: 59
  },
  
  // Retry Configuration
  RETRY_CONFIG: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 5000, // 5 seconds
    BACKOFF_MULTIPLIER: 2
  },
  
  // Telegram Configuration
  TELEGRAM: {
    BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    THREAD_ID: process.env.TELEGRAM_THREAD_ID || null,
    ENABLED: process.env.TELEGRAM_ENABLED === 'true'
  },
  
  // Logger Configuration
  LOGGER: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: 'logs/app.log',
    ERROR_FILE: 'logs/error.log',
    MAX_SIZE: '20m',
    MAX_FILES: '5d'
  }
};

export const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
export const signer = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider); 