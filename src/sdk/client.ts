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
    toronet.initializeSDK({ network: env.TORONET_NETWORK });
    initialized = true;
    logger.info(
      { network: env.TORONET_NETWORK },
      "Toronet SDK initialized",
    );
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
