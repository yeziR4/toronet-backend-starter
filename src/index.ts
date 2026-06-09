import express, { type Express } from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import routes from "./routes/index.js";

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

export { app };
