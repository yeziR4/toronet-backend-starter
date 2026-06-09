import { getSDK } from "./client.js";
import { SdkError, ValidationError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

export interface TransferResult {
  success: boolean;
  txHash?: string;
}

/**
 * Transfer a fiat currency (NGN, USD, EUR, etc.) between Toronet addresses
 * Wraps torosdk.transferCurrency({ currency, senderAddr, senderPwd, receiverAddr, amount }).
 * This is Toronet's core fiat transfer operation — unlike most blockchains,
 * Toronet supports native multi-currency transfers at the protocol level.
 * The senderPwd is required for server-side keystore authentication.
 */
export async function transferCurrency(params: {
  currency: string;
  senderAddr: string;
  senderPwd: string;
  receiverAddr: string;
  amount: string;
}): Promise<TransferResult> {
  if (!params.currency || !params.senderAddr || !params.receiverAddr || !params.amount) {
    throw new ValidationError("currency, senderAddr, receiverAddr, and amount are required");
  }
  try {
    const result = await sdk().transferCurrency(params);
    return { success: true, txHash: result?.txHash ?? result?.txid };
  } catch (err) {
    throw new SdkError(
      "transferCurrency",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Transfer TORO between wallets in the same keystore
 * Wraps torosdk.makeInterWalletTransfer(senderAddr, senderPwd, receiverAddr, amount, currencyName).
 * This is a convenience method for transferring between addresses that share
 * the same server-side keystore, avoiding on-chain gas costs.
 */
export async function makeInterWalletTransfer(
  senderAddr: string,
  senderPwd: string,
  receiverAddr: string,
  amount: string,
  currencyName: string,
): Promise<TransferResult> {
  if (!senderAddr || !receiverAddr || !amount) {
    throw new ValidationError("senderAddr, receiverAddr, and amount are required");
  }
  try {
    const result = await sdk().makeInterWalletTransfer(
      senderAddr,
      senderPwd,
      receiverAddr,
      amount,
      currencyName,
    );
    return { success: true, txHash: result?.txHash ?? result?.txid };
  } catch (err) {
    throw new SdkError(
      "makeInterWalletTransfer",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * List all fiat currencies supported by Toronet
 * Toronet is unique in supporting native multi-currency operations.
 * These currencies can be held, transferred, and exchanged within
 * the Toronet ecosystem without third-party stablecoins.
 */
export function getSupportedCurrencies(): string[] {
  return [
    "TORO", "USD", "EUR", "GBP", "NGN", "KSH", "ZAR", "EGP",
  ];
}

/**
 * Get current exchange rates for all supported assets
 * Wraps torosdk.getSupportedAssetsExchangeRates(). Returns the latest
 * conversion rates between TORO and supported fiat currencies.
 */
export async function getExchangeRates(): Promise<Record<string, unknown>> {
  try {
    return (await sdk().getSupportedAssetsExchangeRates()) ?? {};
  } catch (err) {
    throw new SdkError(
      "getSupportedAssetsExchangeRates",
      err instanceof Error ? err.message : String(err),
    );
  }
}
