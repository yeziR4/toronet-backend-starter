import * as toronet from "torosdk";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { SdkError } from "../types/errors.js";

let initialized = false;

export function getSDK(): typeof toronet {
  if (!initialized) {
    throw new SdkError(
      "SDK not initialized",
      "Call initializeToronetClient() first",
    );
  }
  return toronet;
}

export function initializeToronetClient(): void {
  if (initialized) return;
  try {
    const options: Record<string, string> = { network: env.TORONET_NETWORK };
    if (env.TORONET_BASE_URL) options.baseURL = env.TORONET_BASE_URL;
    if (env.TORONET_CONNECT_W_URL) options.connectWURL = env.TORONET_CONNECT_W_URL;
    if (env.TORONET_DEPLOYER_URL) options.deployerURL = env.TORONET_DEPLOYER_URL;
    toronet.initializeSDK(options);
    initialized = true;
    logger.info(options, "Toronet SDK initialized");
  } catch (err) {
    logger.error({ err }, "Failed to initialize Toronet SDK");
    throw new SdkError(
      "initializeSDK",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export function getSDKConfig() {
  return toronet.getSDKConfig().getConfig();
}
