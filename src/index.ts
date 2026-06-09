import express, { type Express } from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { initializeToronetClient, getSDKConfig } from "./sdk/client.js";
import { errorHandler } from "./middleware/error-handler.js";
import routes from "./routes/index.js";
import { getArchitectureLines } from "./utils/architecture.js";

const app: Express = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    service: "toronet-backend-starter",
    version: "1.0.0",
    network: env.TORONET_NETWORK,
    docs: "https://github.com/yeziR4/toronet-backend-starter",
    endpoints: [
      "/api/wallet",
      "/api/blockchain",
      "/api/balance",
      "/api/tns",
      "/api/kyc",
      "/api/currency",
      "/api/bridge",
      "/api/products",
      "/api/deployer",
    ],
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", network: env.TORONET_NETWORK });
});

app.use("/api", routes);

app.use(errorHandler);

export async function start(): Promise<void> {
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

export { app };
