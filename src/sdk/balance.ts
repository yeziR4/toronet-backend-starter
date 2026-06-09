import { getSDK } from "./client.js";
import { SdkError } from "../types/errors.js";
import { logger } from "../utils/logger.js";

function sdk() {
  return getSDK();
}

/**
 * Get TORO balance for an address
 * Wraps torosdk.getBalance({ address }) which returns ngnBalance, usdBalance,
 * and toroGBalance. This is the primary balance check for the native TORO token.
 */
export async function getBalance(
  address: string,
): Promise<Record<string, unknown>> {
  try {
    return (await sdk().getBalance({ address })) ?? {};
  } catch (err) {
    throw new SdkError(
      "getBalance",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Get balance for a specific fiat currency (NGN, USD, EUR, GBP, etc.)
 * Wraps torosdk.getCurrencyBalance({ currency, address }). Toronet supports
 * multi-currency native balances — this is a key differentiator from other
 * blockchain platforms.
 */
export async function getCurrencyBalance(
  address: string,
  currency: string,
): Promise<Record<string, unknown>> {
  try {
    return (await sdk().getCurrencyBalance({ currency, address })) ?? {};
  } catch (err) {
    throw new SdkError(
      "getCurrencyBalance",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Get token balance (TRC-20 equivalent on Toronet)
 * Wraps torosdk.getTokenBalance({ address }). For checking balances of
 * custom tokens deployed on the Toronet chain.
 */
export async function getTokenBalance(
  address: string,
): Promise<Record<string, unknown>> {
  try {
    return (await sdk().getTokenBalance({ address })) ?? {};
  } catch (err) {
    throw new SdkError(
      "getTokenBalance",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Get token metadata (name, symbol, decimals)
 * Wraps torosdk.getTokenName() / getTokenSymbol() / getTokenDecimal().
 * These are chain-wide values for the primary Toronet token.
 */
export async function getTokenInfo(
  contractAddress: string,
): Promise<Record<string, unknown> | null> {
  try {
    const [name, symbol, decimals] = await Promise.all([
      sdk().getTokenName(),
      sdk().getTokenSymbol(),
      sdk().getTokenDecimal(),
    ]);
    return { name, symbol, decimals };
  } catch (err) {
    logger.warn({ err, contractAddress }, "getTokenInfo failed — contract may not exist or network unavailable");
    return null;
  }
}
