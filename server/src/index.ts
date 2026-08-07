import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./lib/logger.js";
import { getStore } from "./db/index.js";

async function main() {
  await getStore();
  const app = createApp();
  app.listen(config.port, () => {
    logger.info("portsume server listening", { port: config.port, env: config.env });
  });
}

main().catch((e) => {
  logger.error("fatal startup error", { error: String(e) });
  process.exit(1);
});
