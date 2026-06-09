import { logger } from "./utils/logger.js";
import { initializeToronetClient, getSDKConfig } from "./sdk/client.js";
import { getArchitectureLines } from "./utils/architecture.js";
import { env } from "./config/env.js";
import { app } from "./index.js";

async function start(): Promise<void> {
  try {
    initializeToronetClient();
    const config = getSDKConfig();
    logger.info({ config }, "Toronet SDK ready");

    app.listen(env.PORT, env.HOST, () => {
      logger.info(
        { host: env.HOST, port: env.PORT },
        "Server started",
      );
      getArchitectureLines().forEach((line) => logger.info(line));
    });
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
}

start();
