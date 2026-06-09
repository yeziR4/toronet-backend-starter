import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  TORONET_NETWORK: z.enum(["testnet", "mainnet"]).default("testnet"),
  /** Override the Toronet SDK base URL. Defaults to https://api.toronet.org (the
   * known-working endpoint that serves both testnet and mainnet data).
   * The SDK's built-in testnet default (http://testnet.toronet.org) returns 404. */
  TORONET_BASE_URL: z.string().url().optional(),
  /** Override the ConnectW payment gateway URL. */
  TORONET_CONNECT_W_URL: z.string().url().optional(),
  /** Override the contract deployer URL. */
  TORONET_DEPLOYER_URL: z.string().url().optional(),
  PORT: z.coerce.number().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export const env = envSchema.parse(process.env);
