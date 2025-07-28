import { AutomationManager } from "./src/core/automationManager.js";
import { Logger } from "./src/utils/logger.js";

async function main() {
  Logger.info("Starting 0G Automation");
  Logger.info("==================================");
  
  const automationManager = new AutomationManager();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    Logger.info('Received SIGINT, shutting down gracefully...');
    await automationManager.telegramNotifier.sendMessage(
      `<b>🛑 AUTOMATION STOPPED</b>\n` +
      `<b>Time:</b> ${new Date().toLocaleString('id-ID')}\n` +
      `<b>Status:</b> Manual shutdown`
    );
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    Logger.info('Received SIGTERM, shutting down gracefully...');
    await automationManager.telegramNotifier.sendMessage(
      `<b>🛑 AUTOMATION STOPPED</b>\n` +
      `<b>Time:</b> ${new Date().toLocaleString('id-ID')}\n` +
      `<b>Status:</b> System shutdown`
    );
    process.exit(0);
  });

  try {
    await automationManager.run();
  } catch (error) {
    Logger.error(`Fatal error in main function: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  Logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  Logger.error(`Unhandled Rejection: ${reason?.message || reason}`);
  process.exit(1);
});

main().catch((error) => {
  Logger.error(`Main function error: ${error.message}`);
  process.exit(1);
});
